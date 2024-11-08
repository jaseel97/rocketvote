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
    
        // Filter out items with zero votes
        const filteredData = series[0].data.filter((item) => item.value > 0);
    
        // Calculate total for percentages based on filtered values
        const total = filteredData.reduce((sum, item) => sum + item.value, 0);
    
        // Create an array of all data points, calculating percentages based on value and total
        const allData = filteredData.map((item, index) => ({
            ...item,
            percentage: ((item.value / total) * 100).toFixed(1),
            color: COLORS[index % COLORS.length]
        }));
    
        return [{
            ...series[0],
            data: allData,
            arcLabel: (item) => {
                const percentage = item.percentage;
                if (allData.length <= 8) {
                    return `${item.label}: ${percentage}%`;
                }
                return `${percentage}%`;
            },
            arcLabelMinAngle: allData.length <= 8 ? 45 : 20,
            paddingAngle: 2,
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
                right: processedSeries[0].data.length > 8 ? 120 : 20,
                bottom: processedSeries[0].data.length > 8 ? 20 : 60,
            }}
            slotProps={{
                legend: null, // Remove the legend
            }}
        />
    );
};

export default CustomPieChart;