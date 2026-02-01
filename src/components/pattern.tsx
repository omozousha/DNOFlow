import React from 'react';

const Pattern = () => {
  return (
    <div 
      className="w-full h-full"
      style={{
        '--color': 'rgba(114, 114, 114, 0.3)',
        backgroundColor: '#191a1a',
        backgroundImage: 'linear-gradient(0deg, transparent 24%, var(--color) 25%, var(--color) 26%, transparent 27%, transparent 74%, var(--color) 75%, var(--color) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, var(--color) 25%, var(--color) 26%, transparent 27%, transparent 74%, var(--color) 75%, var(--color) 76%, transparent 77%, transparent)',
        backgroundSize: '55px 55px',
      } as React.CSSProperties}
    />
  );
}

export default Pattern;
