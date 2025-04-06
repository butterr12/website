import React, { useEffect, useState } from 'react';
import { Application, Graphics } from 'pixi.js';

const SQUARE_SIZE = 20;

const PixiCanvas: React.FC = () => {
  const [screenRows, setScreenRows] = useState(0);
  const [screenCols, setScreenCols] = useState(0);

  const gradientCanvas = document.createElement('canvas');
  gradientCanvas.width = 1;
  gradientCanvas.height = window.innerHeight;

  const gCtx = gradientCanvas.getContext('2d')!;
  const gradient = gCtx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, '#6597e6'); // blue
  gradient.addColorStop(1, '#75d68c'); // green

  gCtx.fillStyle = gradient;
  gCtx.fillRect(0, 0, 1, window.innerHeight);

  const gradientData = gCtx.getImageData(0, 0, 1, window.innerHeight).data;


  useEffect(() => {
    window.scrollTo(0, 0);
    const tripleHeight = window.innerHeight * 2;
    const rows = Math.ceil(tripleHeight / SQUARE_SIZE);
    const cols = Math.ceil(document.documentElement.clientWidth / SQUARE_SIZE);
    setScreenRows(rows);
    setScreenCols(cols);
  
    document.body.style.height = `${tripleHeight}px`;
    document.body.style.overflowY = 'scroll';
    document.body.style.overflowX = 'hidden';

    const grid: boolean[][] = Array.from({ length: rows * 2 }, () =>
      Array(cols).fill(false)
    );

    const app = new Application();

    app.init({
      width: cols * SQUARE_SIZE,
      height: rows * 2 * SQUARE_SIZE,
      backgroundColor: 0xeeeeee,
    }).then(() => {
      document.body.appendChild(app.canvas);

      const graphics = new Graphics();
      app.stage.addChild(graphics);

      const drawGrid = () => {
        graphics.clear();
        for (let row = 0; row < grid.length; row++) {
          for (let col = 0; col < grid[0].length; col++) {
            const infected = grid[row][col];
            graphics.rect(col * SQUARE_SIZE, row * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE)
            
            if (infected) {
              const y = row * SQUARE_SIZE;
              const pixelY = Math.floor((y % window.innerHeight)); // gradient should follow scroll but i cant make it
            
              const index = pixelY * 4;
              const r = gradientData[index];
              const g = gradientData[index + 1];
              const b = gradientData[index + 2];
            
              const color = (r << 16) + (g << 8) + b;
            
              graphics.fill(color);
            } else {
              graphics.fill(0x00ff00);
            }
            
          }
        }
      };

      console.log(document.body.style.height)

      const getRandomCoord = () => {
        const topVisibleRows = Math.floor(window.innerHeight / SQUARE_SIZE); 
        const r = Math.floor(Math.random() * topVisibleRows); // pick row from top only
        const c = Math.floor(Math.random() * grid[0].length);
        return { row: r, col: c };
      };
      
      const generateRandomDirs = (radius: number, count: number) => {
        const directions: [number, number][] = []; 
        for (let i = 0; i < count; i++) {
          const dx = Math.floor(Math.random() * (2 * radius + 1)) - radius;  
          const dy = Math.floor(Math.random() * (2 * radius + 1)) - radius;  
          if (dx !== 0 || dy !== 0) { 
            directions.push([dx, dy]);
          } else {
            i--; // retry if (0, 0) was generated
          }
        }
        return directions;
      };
      

      const infectAdjacent = (row: number, col: number, nextQueue: { row: number; col: number }[]) => {
        const dirs = generateRandomDirs(5, 5);
        for (const [dr, dc] of dirs) {
          const newRow = row + dr;
          const newCol = col + dc;
          if (
            newRow >= 0 &&
            newRow < grid.length &&
            newCol >= 0 &&
            newCol < grid[0].length &&
            !grid[newRow][newCol]
          ) {
            grid[newRow][newCol] = true;
            nextQueue.push({ row: newRow, col: newCol });
          }
        }
      };

      const start = getRandomCoord();
      grid[start.row][start.col] = true;
      let queue: { row: number; col: number }[] = [start];

      let isScrolling = false;
      let scrollTimeout: number | null = null;

      const onScroll = () => {
        isScrolling = true;
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        scrollTimeout = window.setTimeout(() => {
          isScrolling = false;
        }, 150);
      };


      // calculation stuff so i can detect when i've scrolled to the bottom
        const calculateBottomRow = () => {
        const topRow = Math.floor(window.scrollY / SQUARE_SIZE); 
        const bottomRow = Math.floor((window.scrollY + window.innerHeight) / SQUARE_SIZE); 
        console.log('Top row:', topRow);
        console.log('Bottom row:', bottomRow);
      };
      const printscrollvalues = () => {
      console.log('Inner Height:', window.innerHeight);
      console.log('Scroll Position (scrollY):', window.scrollY);
      console.log('Total Document Height (scrollHeight):', document.documentElement.scrollHeight);
      const scrolledToBottom = (window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight;
      
      if (scrolledToBottom) {
            console.log("im here")
            for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[0].length; col++) {
                grid[row][col] = true; // change color of all uninfected
            }
        }
        drawGrid(); 
    }
}

      window.addEventListener('scroll', () => {
        calculateBottomRow();
        onScroll();
        printscrollvalues();
      });

      const interval = setInterval(() => {
        if (!isScrolling) return;

        const nextQueue: { row: number; col: number }[] = [];
        for (const { row, col } of queue) {
          infectAdjacent(row, col, nextQueue);
        }
         

        // this code is pretty useless since i have if(scrolledtoBottom) already but i dont want to delete it
         const greenCount = grid.flat().filter(value => !value).length;

         if (greenCount < 30) {
           for (let row = 0; row < grid.length; row++) {
             for (let col = 0; col < grid[0].length; col++) {
               if (!grid[row][col]) {
                 grid[row][col] = true; // Make green tiles red
               }
             }
           }
         }

         // the next codes are not useless

        if (nextQueue.length === 0) {
          clearInterval(interval);
        }

        queue = nextQueue;
        drawGrid();
      }, 0);

      drawGrid();

      return () => {
        app.destroy(true);
        window.removeEventListener('scroll', onScroll);
        clearInterval(interval);
      };
    });
  }, []);

  return <div />;
};

export default PixiCanvas;
