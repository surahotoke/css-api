const BASE = 316781;

/*
	値を生成するヘルパー関数
	引数で振る舞いを変えて、複数の機能から使い回す
*/

// 0 〜 max-1 の整数乱数
const random = (max: number): number => Math.floor(Math.random() * max);

// 指定タイムゾーンでの「今日の経過秒数」(0〜86399)
const secondsOfDay = (timeZone: string): number => {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone,
		hour: "2-digit", minute: "2-digit", second: "2-digit",
		hour12: false,
	}).formatToParts(new Date());
	const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
	const h = get("hour") % 24; // hour12:false で 24 が出る環境対策
	return h * 3600 + get("minute") * 60 + get("second");
};

/*
	機能の戻り値:
	- number: 静的な寸法
	- { init, anim }: 初期値 init と、<animate> 群を生成する関数(axis = "width" | "height")
*/
type Feature = number | { init: number; anim: (axis: string) => string };

// 現在値 sec から毎秒+1、period 到達後は 0〜period の無限ループ(永久時計)
const ticking = (sec: number, period: number): Feature => ({
	init: sec,
	anim: (axis) =>
		`<animate id="t" attributeName="${axis}" from="${sec}" to="${period}" dur="${period - sec}s"/>` +
		`<animate attributeName="${axis}" from="0" to="${period}" dur="${period}s" begin="t.end" repeatCount="indefinite"/>`,
});

/*
	機能名 → 値を返す関数の対応表。ここに足せば機能が増える
	width / height で使う場合: 0 ≤ value ≤ 316780
*/

// 0 ≤ value ≤ 316781^2
const sizeFeatures: Record<string, (req: Request) => number> = {
	// 現在のUnix時刻(秒)
	"unix-time": () => Math.floor(Date.now() / 1000),
	// 0〜100350201960 の乱数
	"random": () => random(BASE ** 2),
};

// 0 ≤ value ≤ 316780
const features: Record<string, (req: Request) => Feature> = {
	// アクセス元の現地タイムゾーンでの今日の経過秒数 (0〜86399) から毎秒+1、深夜を跨いで永久に周回
	"current-time": (req) => ticking(secondsOfDay((req.cf?.timezone as string) ?? "UTC"), 86400),
	// 0〜316780 の乱数
	"random": () => random(BASE),
};

export default {
	async fetch(req): Promise<Response> {
		const url = new URL(req.url);

		let w: Feature, h: Feature;

		const sizeName = url.searchParams.get("size");
		if (sizeName) {
			// size: 1つの大きい値を width/height に合成(基数 BASE)
			const fn = sizeFeatures[sizeName];
			const n = fn ? fn(req) : 0;
			w = n % BASE;
			h = Math.floor(n / BASE);
		} else {
			// width/height: 独立した2値
			const pick = (axis: string): Feature => {
				const name = url.searchParams.get(axis);
				const fn = name ? features[name] : undefined;
				return fn ? fn(req) : 0;
			};
			w = pick("width");
			h = pick("height");
		}

		// 値が静的なら属性のみ、アニメ仕様なら init を初期値に <animate> 群を生成
		const dim = (axis: "width" | "height", v: Feature): [number, string] =>
			typeof v === "number" ? [v, ""] : [v.init, v.anim(axis)];

		const [wVal, wAnim] = dim("width", w);
		const [hVal, hAnim] = dim("height", h);

		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${wVal}" height="${hVal}">${wAnim}${hAnim}</svg>`;
		return new Response(svg, {
			headers: {
				"content-type": "image/svg+xml; charset=utf-8",
				"cache-control": "no-store, no-cache, must-revalidate",
			},
		});
	},
} satisfies ExportedHandler<Env>;
