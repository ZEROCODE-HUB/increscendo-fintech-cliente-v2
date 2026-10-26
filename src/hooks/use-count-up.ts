import { useState, useEffect } from 'react';

export const useCountUp = (end: number, duration: number = 1000, delay: number = 0) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let startTime: number;
      let animationId: number;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        setCount(Math.floor(end * easeProgress));

        if (progress < 1) {
          animationId = requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };

      animationId = requestAnimationFrame(animate);

      return () => cancelAnimationFrame(animationId);
    }, delay);

    return () => clearTimeout(timer);
  }, [end, duration, delay]);

  return count;
};
