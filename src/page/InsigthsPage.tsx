import { BarChart } from "@mui/x-charts/BarChart";
import { useAtomValue } from "jotai";
import { storageServiceAtom } from "../atom/storage";
import { useEffect, useState } from "react";
import { BatchReadResult, MONTHS_NAMES } from "../service/remotestorage";
import dayjs from "dayjs";
import { CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

export const InsightsPage = () => {
    const remoteStorageSvc = useAtomValue(storageServiceAtom);
    const [monthlyTransactions, setMonthlyTransactions] = useState<BatchReadResult[]>([]);

    useEffect(() => {
        const now = dayjs();
        if (remoteStorageSvc && remoteStorageSvc.kind === 'remote-storage-service' && monthlyTransactions.length === 0) {
            const query = Array.from({ length: now.month() + 1 }).map((_, idx) => ({
                year: now.year(),
                month: idx,
            }));
            remoteStorageSvc.batchReadMonths(query)
                .then(res => {
                    res.sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year);
                    res.forEach(monthReport => monthReport.data.sort((a, b) => b.date.diff(a.date, 'days')));
                    setMonthlyTransactions([...monthlyTransactions, ...res]);
                });
        }
    }, [remoteStorageSvc]);

    if (monthlyTransactions.length === 0) {
        return <Stack alignItems="center" justifyContent="center" sx={{ height: '100vh' }}><CircularProgress /></Stack>;
    }

    const topCategories = new Set(findTopCategories(monthlyTransactions, 5));

    const aggregatedData = monthlyTransactions
        .flatMap(mon => mon.data.map(tr => ({ year: mon.year, month: mon.month, group: tr.group, amount: tr.amount, type: tr.type })))
        .filter(tr => tr.type === 'expense')
        .reduce((acc, next) => {
            const key = topCategories.has(next.group || '') ? next.group || '' : 'Other';
            if (!acc[key]) {
                return { ...acc, [key]: { [next.month]: next.amount } };
            } else if (!acc[key][next.month]) {
                const aggregated = { ...acc[key], [next.month]: next.amount };
                return { ...acc, [key]: aggregated };
            } else {
                const aggregated = { ...acc[key], [next.month]: acc[key][next.month] + next.amount };
                return { ...acc, [key]: aggregated };
            }
        }, {} as Record<string, Record<number, number>>);

    const series = Object.entries(aggregatedData)
        .map(([group, entries]) => ({
            data: monthlyTransactions.map(m => entries[m.month] || 0),
            label: group,
            id: `${group}Id`,
            stack: 'total',
        }));

    series.sort((a, b) => a.label === 'Other' ? 1 : b.label === 'Other' ? -1 : a.label > b.label ? 1 : -1);

    const currencyFormatter = Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
    return <>
        <BarChart
            height={300}
            series={series}
            xAxis={[{ data: monthlyTransactions.map(m => `${MONTHS_NAMES[m.month]}`), scaleType: 'band' }]}
            yAxis={[{ width: 50 }]}
        />
        <TableContainer component={Paper}>
            <Table aria-label="aggregated transactions">
                <TableHead>
                    <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell align="right">Amount</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Array.from({ length: dayjs().month() + 1 }).map((_, idx) => (
                        <TableRow
                            key={idx}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell >{MONTHS_NAMES[idx]}</TableCell>
                            <TableCell align="right">{currencyFormatter.format(Object.values(aggregatedData).map(r => r[idx] || 0).reduce((acc, next) => acc + next))}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </>;
}

const findTopCategories = (data: BatchReadResult[], count: number): string[] => {
    const amountByGroup = data
        .flatMap(mon => mon.data.map(tr => ({ year: mon.year, month: mon.month, group: tr.group, amount: tr.amount, type: tr.type })))
        .filter(tr => tr.type === 'expense')
        .reduce((acc, next) => {
            const key = next.group || '';
            if (acc[key]) {
                return { ...acc, [key]: acc[key] + next.amount };
            } else {
                return { ...acc, [key]: next.amount };
            }
        }, {} as Record<string, number>);

    const entries = [...Object.entries(amountByGroup)];
    entries.sort(([_ka, a], [_kb, b]) => b - a);
    return entries
        .slice(0, count)
        .map(([k, _]) => k);
};