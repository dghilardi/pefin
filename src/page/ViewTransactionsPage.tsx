import { Alert, Box, CircularProgress, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useSnapCarousel } from "react-snap-carousel";
import ArrowCircleRightRoundedIcon from '@mui/icons-material/ArrowCircleRightRounded';
import ArrowCircleLeftRoundedIcon from '@mui/icons-material/ArrowCircleLeftRounded';
import { useAtomValue } from "jotai";
import { storageServiceAtom } from "../atom/storage";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { BatchReadResult } from "../service/remotestorage";
import { PieChart } from '@mui/x-charts/PieChart';

export const ViewTransactionsPage = () => {
    const remoteStorageSvc = useAtomValue(storageServiceAtom);
    const [monthlyTransactions, setMonthlyTransactions] = useState<BatchReadResult[]>([]);
    const [pendingRequest, setPendingRequest] = useState(false);
    const { scrollRef, snapPointIndexes, next, prev, hasPrevPage, hasNextPage, activePageIndex, refresh } = useSnapCarousel();
    useEffect(() => {
        const now = dayjs();
        const lastLoadedMonth = {
            year: monthlyTransactions.length > 0 ? monthlyTransactions[monthlyTransactions.length - 1].year
                : now.month() < 11 ? now.year()
                    : now.year() + 1,
            month: monthlyTransactions.length > 0 ? monthlyTransactions[monthlyTransactions.length - 1].month
                : now.month() < 11 ? now.month() + 1
                    : 0,

        };
        if (remoteStorageSvc && remoteStorageSvc.kind === 'remote-storage-service' && !pendingRequest && activePageIndex + 3 > monthlyTransactions.length) {
            setPendingRequest(true);
            const query = Array.from({ length: 3 }).map((_, idx) => ({
                year: lastLoadedMonth.month - 1 - idx < 0 ? lastLoadedMonth.year - 1 : lastLoadedMonth.year,
                month: lastLoadedMonth.month - 1 - idx < 0 ? lastLoadedMonth.month - 1 - idx + 12 : lastLoadedMonth.month - 1 - idx,
            }));
            remoteStorageSvc.batchReadMonths(query)
                .then(res => {
                    res.sort((a, b) => a.year === b.year ? b.month - a.month : b.year - a.year);
                    setMonthlyTransactions([...monthlyTransactions, ...res]);
                })
                .finally(() => setPendingRequest(false));
        }
    }, [remoteStorageSvc, pendingRequest, activePageIndex]);
    useEffect(refresh, [monthlyTransactions]);
    if (!remoteStorageSvc || remoteStorageSvc.kind !== 'remote-storage-service') {
        return <Alert>Remote service not initialized</Alert>;
    }
    if (monthlyTransactions.length === 0) {
        return <Stack alignItems="center" justifyContent="center" sx={{ height: '100vh' }}><CircularProgress /></Stack>;
    }
    return <>
        <Carousel scrollRef={scrollRef} snapPointIndexes={snapPointIndexes} monthlyTransactions={monthlyTransactions} />
        <Stack direction="row" justifyContent="space-between">
            <IconButton
                disabled={!hasPrevPage}
                onClick={() => prev()}
            >
                <ArrowCircleLeftRoundedIcon />
            </IconButton>
            <Typography>{dayjs(new Date(monthlyTransactions[activePageIndex].year, monthlyTransactions[activePageIndex].month, 1)).format('YYYY MMM')}</Typography>
            <IconButton
                disabled={!hasNextPage}
                onClick={() => next()}
            >
                <ArrowCircleRightRoundedIcon />
            </IconButton>
        </Stack>
        <TableContainer component={Paper}>
            <Table aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell align="right">Amount</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {monthlyTransactions[activePageIndex].data.map((row, idx) => (
                        <TableRow
                            key={idx}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell component="th" scope="row">
                                {row.date.format('YYYY-MM-DD')}
                            </TableCell>
                            <TableCell>{row.notes}</TableCell>
                            <TableCell align="right">{row.amount}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </>;
}

export const Carousel = (p: {
    monthlyTransactions: BatchReadResult[],
    scrollRef: (el: HTMLElement | null) => void,
    snapPointIndexes: Set<number>,
}) => {
    const aggregatedTransactions = p.monthlyTransactions.map(mt => Object.entries(mt.data
        .filter(transaction => transaction.type === 'expense')
        .reduce((acc, next) => {
        const lvl1key = next.group || 'other';
        const lvl2key = next.category || 'other';
        if (acc[lvl1key]) {
            acc[lvl1key].sum += next.amount;
            if (acc[lvl1key].sub[lvl2key]) {
                acc[lvl1key].sub[lvl2key] += next.amount;
            } else {
                acc[lvl1key].sub[lvl2key] = next.amount;
            }
        } else {
            acc[lvl1key] = { sum: next.amount, sub: { [lvl2key]: next.amount }};
        }
        return acc;
    }, {} as Record<string, { sum: number, sub: Record<string, number>}>))
        .map(([lvl1, values]) => ({ name: lvl1, amount: values.sum, sub: Object.entries(values.sub).map(([lvl2, amount]) => ({ name: lvl2, amount }))})));
    
    aggregatedTransactions.forEach(mon => mon.sort((a, b) => b.amount - a.amount));
    aggregatedTransactions.forEach(mon => mon.forEach(grp => grp.sub.sort((a, b) => b.amount - a.amount)));
    return (
        <>
            <Stack
                flex={1}
                width="100%"
                direction="row"
                overflow="auto"
                sx={{
                    scrollSnapType: 'x mandatory',
                    '::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none',
                }}
                ref={p.scrollRef}
            >
                {p.monthlyTransactions.map((_, i) => (
                    <Box
                        key={i}
                        display="block"
                        width="100%"
                        flexShrink={0}
                        sx={{
                            scrollSnapAlign: p.snapPointIndexes.has(i) ? "start" : "",
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <PieChart
                            series={[
                                {
                                    innerRadius: 0,
                                    outerRadius: 60,
                                    data: aggregatedTransactions[i].map((grp, idx) => ({ label: grp.name, value: grp.amount, color: HSVtoRGB(idx/aggregatedTransactions[i].length, 0.9, 0.9) })),
                                },
                                {
                                    innerRadius: 60,
                                    outerRadius: 110,
                                    data: aggregatedTransactions[i]
                                        .flatMap((grp, idx) => grp.sub.map((sub, subidx) => ({ _label: sub.name, value: sub.amount, color: HSVtoRGB(idx/aggregatedTransactions[i].length, 0.4 + 0.6 * (subidx / grp.sub.length), 0.9) }))),
                                },
                            ]}
                            width={250}
                            height={250}
                        />
                    </Box>
                ))}
            </Stack>
        </>
    );
};

function HSVtoRGB(h: number, s: number, v: number) {
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    const result = `#${Math.round(r * 255).toString(16)}${Math.round(g * 255).toString(16)}${Math.round(b * 255).toString(16)}`;
    return result;
}