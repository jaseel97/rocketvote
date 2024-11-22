import React, { useState } from 'react';
import { TrashIcon as TrashOutline } from '@heroicons/react/24/outline';

const TemplateDeleteZone = ({ onDeleteTemplate }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isTemplateHeld, setIsTemplateHeld] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const templateType = e.dataTransfer.getData('text/plain');
    onDeleteTemplate(templateType);
    setIsDraggingOver(false);
  };

  return (
    <div
      className={`
        fixed left-1/2 bottom-8 -translate-x-1/2
        w-16 h-16 
        flex items-center justify-center
        rounded-full
        transition-all duration-300 ease-in-out
        ${isTemplateHeld ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}
        ${isDraggingOver ? 'opacity-100 scale-125' : ''}
        bg-gray-100 dark:bg-gray-800
        border-2 border-red-500/30 dark:border-red-400/30
        shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9)]
        dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1)]
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <TrashOutline
        className={`
          w-8 h-8
          transition-all duration-300
          ${isDraggingOver ? 'text-red-500 dark:text-red-400 scale-125' : 'text-gray-400 dark:text-gray-600'}
          ${isTemplateHeld ? 'text-red-500/70 dark:text-red-400/70' : ''}
        `}
      />
    </div>
  );
};

export default TemplateDeleteZone;