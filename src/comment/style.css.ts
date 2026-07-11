export const WIDTH = 380
export const PADDING = 12
export const CONTENT_WIDTH = WIDTH - PADDING * 2
export const BODY_FONT_SIZE = 14
export const LINE_HEIGHT = Math.round(BODY_FONT_SIZE * 1.5)
export const DATETIME_FONT_SIZE = 11
export const BLOCK_PADDING_Y = 10
export const BORDER_WIDTH = 1

export const STYLE = /*css*/ `
  [root] {
    font-family: system-ui, sans-serif;
    padding-inline: ${PADDING}px;
    color: #333;
  }

  div.item {
    padding-block: ${BLOCK_PADDING_Y}px;
    border-top: ${BORDER_WIDTH}px solid #ddd;
  }

  div.item:first-child { border-top: none }

  div.head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    line-height: ${LINE_HEIGHT}px;
  }

  span.name {
    font-weight: bold;
    color: #222;
    font-size: ${BODY_FONT_SIZE}px;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-fit: shrink;
  }

  span.dt {
    color: #999;
    font-size: ${DATETIME_FONT_SIZE}px;
    white-space: nowrap;
  }

  p.body {
    margin: 0;
    font-size: ${BODY_FONT_SIZE}px;
    line-height: ${LINE_HEIGHT}px;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  p.empty {
    margin: 0;
    padding-block: ${BLOCK_PADDING_Y}px;
    font-size: ${BODY_FONT_SIZE}px;
    line-height: ${LINE_HEIGHT}px;
    color: #999;
    text-align: center;
  }
`
