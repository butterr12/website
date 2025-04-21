import React, { useRef, useEffect, useState } from 'react'
// Just for reference:
// useRef to get direct access to DOM elements (like canvases)
// useEffect to run code when the component mounts/updates
// useState to store component state

const tileSize = 18

const OverlayTileCanvas: React.FC = () => { 
  const backgroundRef = useRef<HTMLCanvasElement | null>(null)
  const overlayRef = useRef<HTMLCanvasElement | null>(null)

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [clearedOverlayTiles, setClearedOverlayTiles] = useState<Set<string>>(new Set())
  const [clearedBackgroundTiles, setClearedBackgroundTiles] = useState<Set<string>>(new Set())
  const prevClearedBackgroundTiles = useRef<Set<string>>(new Set());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); 

  useEffect(() => {
    const updateDimensions = () => {
      const width = document.documentElement.clientWidth
      const height = document.documentElement.scrollHeight

      setDimensions({ width, height })

      const canvases = [backgroundRef.current, overlayRef.current]
      canvases.forEach(canvas => {
        if (canvas) {
          canvas.width = width
          canvas.height = height
          canvas.style.height = `${height}px`
        }
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Overlay Layer (white tiles + black lines + blue-green gradient overlay on top)
useEffect(() => {
    //window.scrollTo(0, 0);
    const canvas = backgroundRef.current
    if (!canvas) return
  
    const ctx = canvas.getContext('2d')
    if (!ctx) return
  
    const { width, height } = dimensions
  
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1.2
  
    for (let y = 0; y <= height; y += 3) {
      ctx.beginPath()
      ctx.moveTo(0, y+0.5)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  
    const gradientHeight = height
    const gradient = ctx.createLinearGradient(0, 0, 0, gradientHeight)
    gradient.addColorStop(0, 'rgba(90, 104, 134, 0.5)')  // #6490f2
    gradient.addColorStop(1, 'rgba(145, 223, 160, 0.8)')  // #75d78a
  
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, gradientHeight)
  }, [dimensions])
  

  // Overlay Layer (white tiles + black lines)
  useEffect(() => {
    const canvas = overlayRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = dimensions

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1.2

    for (let y = 0; y <= height; y += 3) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y+0.5)
      ctx.stroke()
    }
  }, [dimensions])

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;
  
    const cols = Math.floor(dimensions.width / tileSize);
    const rows = Math.floor((window.innerHeight / 2) / tileSize);
  
    const initialInfected = new Set<string>();
  
    const numberOfInfected = 3;
    for (let i = 0; i < numberOfInfected; i++) {
      const { row, col } = getRandomCoord(cols, rows);
      const x = col * tileSize;
      const y = row * tileSize;
      const key = `${x}x${y}`;
      initialInfected.add(key);
    }
  
    setClearedOverlayTiles(initialInfected);
  
    const overlayCanvas = overlayRef.current;
    if (overlayCanvas) {
      const overlayCtx = overlayCanvas.getContext('2d');
      if (overlayCtx) {
        for (const key of initialInfected) {
          const [xStr, yStr] = key.split('x');
          const x = parseInt(xStr, 10);
          const y = parseInt(yStr, 10);
          overlayCtx.clearRect(x, y, tileSize, tileSize);
        }
      }
    }
  }, [dimensions]);
  

  useEffect(() => {
    const overlayCanvas = overlayRef.current;
    const backgroundCanvas = backgroundRef.current;
    if (!overlayCanvas || !backgroundCanvas) return;
  
    const overlayCtx = overlayCanvas.getContext('2d');
    const backgroundCtx = backgroundCanvas.getContext('2d');
    if (!overlayCtx || !backgroundCtx) return;
  
    const handleScroll = () => {
      setClearedOverlayTiles(prev => {
        const newSet = new Set(prev);
        const toInfect = new Set<string>();
  
        for (const key of prev) {
          const [xStr, yStr] = key.split('x');
          const x = parseInt(xStr, 10);
          const y = parseInt(yStr, 10);
  
          const dirs = generateRandomDirs(4 + Math.floor(Math.random() * 2));   // infects 4 (+1 optional) tiles
          for (const [dr, dc] of dirs) {
            const nx = x + dr * tileSize;
            const ny = y + dc * tileSize;

            //const limitHeight = window.innerHeight / 2; //nevermind this

            if (nx >= 0 && ny >= 0 && nx < dimensions.width && ny < dimensions.height) {
              const neighborKey = `${nx}x${ny}`;
              if (!newSet.has(neighborKey)) {
                overlayCtx.clearRect(nx, ny, tileSize, tileSize);
                toInfect.add(neighborKey);
              }
            }
          }
        }
  
        for (const key of toInfect) {
          newSet.add(key);
        }
  
        return newSet;
      });
  
      // Update background tiles for the cleared overlay
      setClearedBackgroundTiles(prev => {
        const newSet = new Set(prev);
        for (const tileKey of clearedOverlayTiles) {
          if (!newSet.has(tileKey)) {
            newSet.add(tileKey);
          }
        }
        return newSet;
      });
    };
  
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dimensions, clearedOverlayTiles]);
  

  // // First clears overlay, then background
  // useEffect(() => {
  //   const overlayCanvas = overlayRef.current
  //   const backgroundCanvas = backgroundRef.current
  //   if (!overlayCanvas || !backgroundCanvas) return

  //   const overlayCtx = overlayCanvas.getContext('2d')
  //   const backgroundCtx = backgroundCanvas.getContext('2d')
  //   if (!overlayCtx || !backgroundCtx) return

  //   const handleClick = (e: MouseEvent) => {
  //     const rect = overlayCanvas.getBoundingClientRect()
  //     const x = e.clientX - rect.left // I didn't need the rect.left because it's always 0 (width is fixed) but just making sure
  //     const y = e.clientY - rect.top

  //     const tileX = Math.floor(x / tileSize) * tileSize
  //     const tileY = Math.floor(y / tileSize) * tileSize
  //     const key = `${tileX}x${tileY}`

  //     if (!clearedOverlayTiles.has(key)) {
  //       overlayCtx.clearRect(tileX, tileY, tileSize, tileSize);
  //       setClearedOverlayTiles(prev => {
  //         const newSet = new Set(prev);
  //         newSet.add(key);
  //         return newSet;
  //       });
    
  //     } else if (!clearedBackgroundTiles.has(key)) {
  //       setClearedBackgroundTiles(prev => {
  //         const newSet = new Set(prev);
  //         newSet.add(key);
  //         return newSet;
  //       });
  //     }
  //   }
    
      
  //   //   if (clearedOverlayTiles.has(key)) {
  //   //   //   // backgroundCtx.clearRect(tileX, tileY, tileSize, tileSize);

  //   //   //   // backgroundCtx.lineWidth = 1;

  //   //   //   // // Find all cleared tiles at the same x
  //   //   //   // const clearedYsAtX = Array.from(clearedOverlayTiles)
  //   //   //   //   .filter(tileKey => tileKey.startsWith(`${tileX}x`))
  //   //   //   //   .map(tileKey => parseInt(tileKey.split('x')[1]));

  //   //   //   // const minY = Math.min(...clearedYsAtX);
  //   //   //   // const maxY = Math.max(...clearedYsAtX);

  //   //   //   // // Draw white line only if this tile is the topmost
  //   //   //   // if (tileY === minY) {
  //   //   //   //   backgroundCtx.strokeStyle = '#ffffff';  
  //   //   //   //   backgroundCtx.beginPath();
  //   //   //   //   backgroundCtx.moveTo(tileX, tileY);
  //   //   //   //   backgroundCtx.lineTo(tileX + tileSize, tileY);
  //   //   //   //   backgroundCtx.stroke();
  //   //   //   // }

  //   //   //   // // Draw black line only if this tile is the bottommost
  //   //   //   // if (tileY === maxY) {
  //   //   //   //   backgroundCtx.strokeStyle = '#000000';  
  //   //   //   //   backgroundCtx.beginPath();
  //   //   //   //   backgroundCtx.moveTo(tileX, tileY + tileSize);
  //   //   //   //   backgroundCtx.lineTo(tileX + tileSize, tileY + tileSize);
  //   //   //   //   backgroundCtx.stroke();
  //   //   //   // }

  //   //   } else {
  //   //     // If not, it first clears tile on overlay and track it
  //   //     overlayCtx.clearRect(tileX, tileY, tileSize, tileSize)

  //   //     setClearedOverlayTiles(prev => {
  //   //       const newSet = new Set(prev)
  //   //       newSet.add(key)
  //   //       return newSet
  //   //     })

  //   //     document.body.classList.add('tiles-cleared')
  //   //   }
  //   // }

  //   overlayCanvas.addEventListener('click', handleClick)
  //   return () => overlayCanvas.removeEventListener('click', handleClick)
  // }, [dimensions, clearedOverlayTiles])

  

  useEffect(() => {
    const backgroundCanvas = backgroundRef.current;
    if (!backgroundCanvas) return;
    const backgroundCtx = backgroundCanvas.getContext('2d');
    if (!backgroundCtx) return;
  
    console.log('%cStarting background update...', 'color: cyan; font-weight: bold;');
    console.log('%cclearedBackgroundTiles:', 'color: #00bcd4;', Array.from(clearedBackgroundTiles));
  
    for (const tileKey of clearedBackgroundTiles) {
      if (prevClearedBackgroundTiles.current.has(tileKey)) {
        continue; // skip already processed
      }
  
      const [xStr, yStr] = tileKey.split('x');
      const x = parseInt(xStr, 10);
      const y = parseInt(yStr, 10);
  
      console.log(`Clearing new tile at (${x}, ${y})`);
      backgroundCtx.clearRect(x, y, tileSize, tileSize);
      backgroundCtx.lineWidth = 0.5;
  
      const aboveKey = `${x}x${y - tileSize}`;
      const belowKey = `${x}x${y + tileSize}`;
  
      // Top border
      if (!clearedBackgroundTiles.has(aboveKey)) {
        console.log(`%cDrawing TOP border at (${x}, ${y})`, 'color: red;');
        backgroundCtx.strokeStyle = '#ffffff';
        backgroundCtx.beginPath();
        backgroundCtx.moveTo(x, y);
        backgroundCtx.lineTo(x + tileSize, y);
        backgroundCtx.stroke();
      } else {
        console.log(`%cTop neighbor exists, clearing shared border at (${x}, ${y})`, 'color: orange;');
        backgroundCtx.clearRect(x, y - 1, tileSize, 2); // "erase" shared line
      }
  
      // Bottom border
      if (!clearedBackgroundTiles.has(belowKey)) {
        console.log(`%cDrawing BOTTOM border at (${x}, ${y + tileSize})`, 'color: green;');
        backgroundCtx.strokeStyle = '#000000';
        backgroundCtx.beginPath();
        backgroundCtx.moveTo(x, y + tileSize);
        backgroundCtx.lineTo(x + tileSize, y + tileSize);
        backgroundCtx.stroke();
      } else {
        console.log(`%cBottom neighbor exists, clearing shared border at (${x}, ${y + tileSize})`, 'color: lime;');
        backgroundCtx.clearRect(x, y + tileSize - 1, tileSize, 2); // "erase" shared line
      }
    }
  
    prevClearedBackgroundTiles.current = new Set(clearedBackgroundTiles);
  
    console.log('%cBackground update finished.', 'color: cyan; font-weight: bold;');
  }, [clearedBackgroundTiles]);
  
  const getRandomCoord = (cols: number, rows: number) => {
    const r = Math.floor(Math.random() * rows); 
    const c = Math.floor(Math.random() * cols);
    return { row: r, col: c };
  };
  
  // const generateRandomDirs = (radius: number, count: number) => {
  //   const directions: [number, number][] = [];
  //   for (let i = 0; i < count; i++) {
  //     const dx = Math.floor(Math.random() * (2 * radius + 1)) - radius;
  //     const dy = Math.floor(Math.random() * (2 * radius + 1)) - radius;
  //     if (dx !== 0 || dy !== 0) {
  //       directions.push([dx, dy]);
  //     } else {
  //       i--; // Retry if (0, 0)
  //     }
  //   }
  //   return directions;
  // };

  const generateRandomDirs = (count: number): [number, number][] => {
    const weightedDirections: [number, number][] = [
      [0, 1], [0, 2], [0, 1], [0, 1],  // down (weight = 4)
      [0, -1], [0, -1],               // up (weight = 2)
      [-1, 0], [1, 0], [2,0], [-2, 0],               // left and right (weight = 1 each)
      [-1, 1], [1, 1],                // diagonals down-left, down-right (optional)
    ];
  
    // randomize
    for (let i = weightedDirections.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [weightedDirections[i], weightedDirections[j]] = [weightedDirections[j], weightedDirections[i]];
    }
  
    return weightedDirections.slice(0, count); // return first `count` directions
  };
  

  
  

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}>
      <canvas
        ref={backgroundRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 5,
        }}
      />
      <canvas
        ref={overlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 10,
          pointerEvents: 'auto',
        }}
      />
    </div>
  )
}

export default OverlayTileCanvas
