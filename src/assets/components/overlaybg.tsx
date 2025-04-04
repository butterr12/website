import React, { useEffect, useState } from 'react';
import '../styling/overlaybg.css'; 

const ROWS = 60;
const COLS = 100;

interface Overlay {
  scrollProgress: number; 
}

const Overlay: React.FC<Overlay> = ({ scrollProgress }) => {
  const [claimedTiles, setClaimedTiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const totalTiles = ROWS * COLS;
    const tilesToClaim = Math.floor(scrollProgress * totalTiles);

    setClaimedTiles((prev) => {
      const newTiles = new Set(prev);

      //claim new tiles based on scroll progress
      while (newTiles.size < tilesToClaim) {
        const row = Math.floor(Math.random() * ROWS);
        const col = Math.floor(Math.random() * COLS);
        newTiles.add(`${row}-${col}`);
      }

      return new Set(newTiles);
    });
  }, [scrollProgress]); //re-run when scrollProgress changes

  return (
    <div className="overlay">
      {Array.from({ length: ROWS }).map((_, row) =>
        Array.from({ length: COLS }).map((_, col) => {
          const isClaimed = claimedTiles.has(`${row}-${col}`);
          return (
            <div
              key={`${row}-${col}`}
              className="square"
              style={{
                background: isClaimed
                  ? 'linear-gradient(to bottom, #6597e6, #75d68c)' //gradient for claimed tiles but it applies the gradient to every single tile
                  : 'transparent', //transparent if not claimed
              }}
            />
          );
        })
      )}
    </div>
  );
};

export default Overlay;
