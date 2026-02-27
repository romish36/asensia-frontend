import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { usePermissionContext } from '../contexts/PermissionContext';

const DashboardCharts = ({ salesData, purchaseVsPaymentData }) => {
    const { hasPermission } = usePermissionContext();

    const showSales = hasPermission('Invoice', 'view');
    const showPurchase = hasPermission('Purchase Order', 'view');

    if (!showSales && !showPurchase) return null;

    return (
        <div className="dashboard-charts">
            {/* 1. Area Chart (Total Sales Last 12 Months) */}
            {showSales && (
                <div className="chart-container">
                    <h3 className="chart-title">Total Sales (Last 12 Months)</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0891b2" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={(value) => `₹${(value / 1000).toFixed(2)}k`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`₹${value.toFixed(2)}`, 'Sales']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#0891b2"
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* 2. Line Chart (Purchase Invoice vs Payment) */}
            {showPurchase && (
                <div className="chart-container">
                    <h3 className="chart-title">Purchase Invoice vs Payment</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={purchaseVsPaymentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={(value) => `₹${(value / 1000).toFixed(2)}k`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`₹${value.toFixed(2)}`, '']}
                                />
                                <Legend verticalAlign="top" align="right" iconType="circle" />
                                <Line
                                    type="monotone"
                                    dataKey="invoice"
                                    stroke="#7c3aed"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6 }}
                                    name="Invoices"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="payment"
                                    stroke="#16a34a"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6 }}
                                    name="Payments"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardCharts;
