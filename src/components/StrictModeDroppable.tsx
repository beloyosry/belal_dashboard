import { useEffect, useState } from 'react';
import { Droppable, DroppableProps } from 'react-beautiful-dnd';

/**
 * Workaround component for React 18 Strict Mode compatibility with react-beautiful-dnd
 * See: https://github.com/atlassian/react-beautiful-dnd/issues/2399
 */
export const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    // This is a workaround for react-beautiful-dnd in React 18 Strict Mode
    // We need to wait for a tick before enabling the Droppable
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  
  if (!enabled) {
    return null;
  }
  
  return <Droppable {...props}>{children}</Droppable>;
};
