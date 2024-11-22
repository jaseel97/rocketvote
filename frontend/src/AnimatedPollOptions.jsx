import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedPollOptions = ({ options, counts, selectedOption, setSelectedOption, getVotersForOption }) => {
    const [hoveredOption, setHoveredOption] = React.useState(null);

    // Sort options by vote count in descending order
    const sortedOptions = [...options].sort((a, b) => (counts[b] || 0) - (counts[a] || 0));

    return (
        <div className={`grid gap-4 ${options.length > 4 ? "grid-cols-2" : "grid-cols-1"}`}>
            <AnimatePresence>
                {sortedOptions.map((option, index) => (
                    <motion.div
                        key={option}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                            opacity: { duration: 0.2 },
                            layout: { duration: 0.4, type: "spring", bounce: 0.25 }
                        }}
                    >
                        <div
                            onClick={() => setSelectedOption(selectedOption === option ? null : option)}
                            onMouseEnter={() => setHoveredOption(option)}
                            onMouseLeave={() => setHoveredOption(null)}
                            className={`
                relative overflow-hidden
                w-full cursor-pointer 
                rounded-2xl
                bg-gradient-to-r from-gray-50 to-gray-100
                dark:from-gray-800 dark:to-gray-750
                border-2
                transition-all duration-300 ease-in-out
                ${selectedOption === option || hoveredOption === option
                                    ? `
                    text-zinc-700 dark:text-zinc-300
                    border-zinc-500/50 dark:border-zinc-400/50
                    shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_10px_rgba(113,113,122,0.3)]
                    dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_10px_rgba(161,161,170,0.3)]
                    scale-[1.02]
                  `
                                    : `
                    text-zinc-600 dark:text-zinc-400
                    border-zinc-500/30 dark:border-zinc-400/30
                    shadow-[4px_4px_10px_0_rgba(0,0,0,0.1),-4px_-4px_10px_0_rgba(255,255,255,0.9),0_0_10px_rgba(113,113,122,0.2)]
                    dark:shadow-[4px_4px_10px_0_rgba(0,0,0,0.3),-4px_-4px_10px_0_rgba(255,255,255,0.1),0_0_10px_rgba(161,161,170,0.2)]
                    scale-100
                  `
                                }
              `}
                        >
                            <div className="relative z-10 p-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-left transition-all duration-300 ease-in-out">
                                        {option}
                                    </span>
                                    <span className="font-medium transition-all duration-300 ease-in-out">
                                        {counts[option] || 0} {(counts[option] || 0) === 1 ? 'vote' : 'votes'}
                                    </span>
                                </div>

                                <div className={`
                  mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700
                  transition-all duration-300 ease-in-out
                  ${(selectedOption === option || hoveredOption === option)
                                        ? 'opacity-100 max-h-20'
                                        : 'opacity-0 max-h-0 overflow-hidden'
                                    }
                `}>
                                    <p className="text-sm text-left max-h-16 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-thumb]:rounded-full dark:[&::-webkit-scrollbar-thumb]:bg-zinc-600">
                                        <strong>Chosen by</strong>: {getVotersForOption(option).length > 0 ? getVotersForOption(option).join(', ') : <span className="italic">None</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:to-black/10 transition-all duration-300 ease-in-out"></div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default AnimatedPollOptions;