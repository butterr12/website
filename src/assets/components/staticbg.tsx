import React, { useEffect, useRef, useState } from 'react';
import '../styling/staticbg.css';
import Overlay from './overlaybg'; 

const StaticBackground = () => {
  const containerRef = useRef<HTMLDivElement | null>(null); 
  const [scrollProgress, setScrollProgress] = useState(0); 

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return; 

    const handleScroll = () => {
      const scrollPosition = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const progress = scrollPosition / scrollHeight;
      setScrollProgress(progress); 
    };

    console.log('adding scroll event listener');
    container.addEventListener('scroll', handleScroll, false);

    return () => {
      console.log('removing scroll event listener');
      container.removeEventListener('scroll', handleScroll, false);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="static-background"
      style={{ height: '100vh', overflowY: 'scroll' }}
    >
      <div className="content-wrapper">
        <div className="static-lines"></div>
        <div className="scroll-content">
          <p>scroll down to see the effect...</p>
        </div>
        <Overlay scrollProgress={scrollProgress} />
      </div>
    </div>
  );
};

export default StaticBackground;
