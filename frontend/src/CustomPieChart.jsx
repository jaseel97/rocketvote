import React, { useMemo } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';

const CustomPieChart = ({ series, height = 300, slotProps }) => {
    // Color palette optimized for up to 15 distinct colors
    const COLORS = [
        '#2563eb', '#db2777', '#16a34a', '#ea580c', '#6366f1',
        '#84cc16', '#7c3aed', '#06b6d4', '#dc2626', '#f59e0b',
        '#64748b', '#ec4899', '#0ea5e9', '#10b981', '#8b5cf6'
    ];

    const processedSeries = useMemo(() => {
        if (!series?.[0]?.data || series[0].data.length === 0) {
            return null;
        }
    
        // Calculate total for percentages, including all data points
        const total = series[0].data.reduce((sum, item) => sum + item.value, 0);
    
        // Create an array of all data points, handling the data point with a value of 1 separately
        const allData = series[0].data.map((item, index) => {
            if (item.value === 1) {
                return {
                    ...item,
                    percentage: 1 / series[0].data.length * 100,
                    color: COLORS[index % COLORS.length]
                };
            } else {
                return {
                    ...item,
                    // Store percentage for consistent access
                    percentage: ((item.value / total) * 100).toFixed(1),
                    color: COLORS[index % COLORS.length]
                };
            }
        });
    
        return [{
            ...series[0],
            data: allData,
            // Adjust arc label based on number of options
            arcLabel: (item) => {
                const percentage = item.percentage;
                // For fewer options, show both label and percentage
                if (allData.length <= 8) {
                    return `${item.label}: ${percentage}%`;
                }
                // For more options, show only percentage to avoid overlap
                return `${percentage}%`;
            },
            // Adjust minimum angle based on number of options
            arcLabelMinAngle: allData.length <= 8 ? 45 : 20,
            // Increase spacing between segments for better readability
            paddingAngle: 2,
            // Add inner radius for donut style when there are many options
            innerRadius: allData.length > 8 ? 60 : 0,
        }];
    }, [series]);

    if (!processedSeries) {
        return (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
                No data available
            </div>
        );
    }

    return (
        <PieChart
            series={processedSeries}
            height={height}
            tooltip={{
                trigger: "item",
                formatter: (item) => `${item.label}: ${item.value} votes (${item.percentage}%)`
            }}
            margin={{
                // Adjust margins based on legend position
                right: processedSeries[0].data.length > 8 ? 120 : 20,
                bottom: processedSeries[0].data.length > 8 ? 20 : 60,
            }}
        />
    );
};

export default CustomPieChart;