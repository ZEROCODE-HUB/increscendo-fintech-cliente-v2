import { useCountUp } from '@/hooks/use-count-up';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
  formatter?: (value: number) => string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  delay = 0,
  className = '',
  formatter,
}) => {
  const count = useCountUp(value, duration, delay);
  
  return (
    <span className={className}>
      {formatter ? formatter(count) : count}
    </span>
  );
};
