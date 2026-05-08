"use client";

import HeatMap from '@uiw/react-heat-map';

export const ActiveBoard = () => {
    // Generate mock data for the last 365 days
    const generateMockData = () => {
        const data: Array<{ date: string; count: number }> = [];
        const today = new Date();

        for (let i = 364; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            // Random activity count (0-15)
            const count = Math.floor(Math.random() * 16);

            data.push({
                date: date.toISOString().split('T')[0],
                count
            });
        }

        return data;
    };

    const activityData = generateMockData();

    const panelColors = {
        0: '#EBEDF0',
        2: '#9BE9A8',
        4: '#40C463',
        8: '#30A14E',
        10: '#216E39',
    };

    return (
        <div className="w-full px-4 pb-4">
            <div className="w-full bg-[#F8F9FA] rounded-3xl p-3 py-3">
                <h3 className="text-lg font-semibold text-[#1C1C1E]">Activity Heatmap</h3>

                <div className="overflow-x-auto">
                    <HeatMap
                        value={activityData}
                        width="100%"
                        startDate={new Date(new Date().setDate(new Date().getDate() - 364))}
                        endDate={new Date()}
                        rectSize={12}
                        space={3}
                        legendCellSize={0}
                        panelColors={panelColors}
                        weekLabels={['S', 'M', 'T', 'W', 'T', 'F', 'S']}
                        monthLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                        style={{ color: '#9CA3AF' }}
                        rectProps={{
                            rx: 2,
                        }}
                    />
                </div>

                {/* Custom Legend */}
                {/* <div className="flex items-center gap-2 mt-6 justify-end">
                    <span className="text-xs text-gray-400">Less</span>
                    <div className="flex gap-1">
                        {Object.values(panelColors).map((color, index) => (
                            <div
                                key={index}
                                className="rounded-sm"
                                style={{
                                    backgroundColor: color,
                                    width: 12,
                                    height: 12,
                                }}
                            />
                        ))}
                    </div>
                    <span className="text-xs text-gray-400">More</span>
                </div> */}
            </div>
        </div>
    );
};