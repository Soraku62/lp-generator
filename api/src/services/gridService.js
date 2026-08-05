function calculateGridSplit({
  imageUrl,
  imageWidth,
  imageHeight,
  rows,
  cols
}) {
  const cellWidth = imageWidth / cols;
  const cellHeight = imageHeight / rows;

  const cells = [];

  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      cells.push({
        id: `r${row}c${col}`,
        row,
        col,
        x: Math.round((col - 1) * cellWidth),
        y: Math.round((row - 1) * cellHeight),
        width: Math.round(cellWidth),
        height: Math.round(cellHeight)
      });
    }
  }

  return {
    imageUrl,
    grid: {
      rows,
      cols,
      imageWidth,
      imageHeight,
      cellWidth: Math.round(cellWidth),
      cellHeight: Math.round(cellHeight)
    },
    cells
  };
}

module.exports = {
  calculateGridSplit
};