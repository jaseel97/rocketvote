import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';

const COLORS = [
    '#2563eb', '#db2777', '#16a34a', '#ea580c', '#6366f1',
    '#84cc16', '#7c3aed', '#06b6d4', '#dc2626', '#f59e0b',
    '#64748b', '#ec4899', '#0ea5e9', '#10b981', '#8b5cf6'
];

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, label, index, data }) => {
    // if (percent < 0.05)
    //     return null;

    const radius = outerRadius * 1.15;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const showFullLabel = data.length <= 8;
    const displayText = showFullLabel
        ? `${label}: ${(percent * 100).toFixed(1)}%`
        : `${(percent * 100).toFixed(1)}%`;

    const textAnchor = x > cx ? 'start' : 'end';

    const fill = COLORS[index % COLORS.length];

    return (
        <text
            x={x}
            y={y}
            fill={fill}
            textAnchor={textAnchor}
            dominantBaseline="central"
            className="text-l font-semibold"
        >
            {displayText}
        </text>
    );
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const fill = COLORS[payload[0].dataIndex % COLORS.length];
        return (
            <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-900 dark:text-gray-100" style={{ color: fill }}>
                    {`${data.label} : ${data.value} votes`}
                </p>
            </div>
        );
    }
    return null;
};

const CustomPieChart = ({ series, height = 300 }) => {
    if (!series?.[0]?.data || series[0].data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
                No Votes Yet
            </div>
        );
    }

    const data = series[0].data
        .filter(item => item.value > 0)
        .map(item => ({
            ...item,
            percent: item.value / series[0].data.reduce((sum, i) => sum + i.value, 0)
        }));

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
                No votes yet
            </div>
        );
    }

    const innerRadius = data.length > 8 ? 60 : 0;

    return (
        <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={props => renderCustomizedLabel({ ...props, data })}
                        innerRadius={innerRadius}
                        outerRadius={Math.min(height, 300) / 2.5}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CustomPieChart;