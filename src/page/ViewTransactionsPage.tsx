import { Alert, Box, CircularProgress, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useSnapCarousel } from "react-snap-carousel";
import ArrowCircleRightRoundedIcon from '@mui/icons-material/ArrowCircleRightRounded';
import ArrowCircleLeftRoundedIcon from '@mui/icons-material/ArrowCircleLeftRounded';
import { useAtomValue } from "jotai";
import { storageServiceAtom } from "../atom/storage";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { BatchReadResult } from "../service/remotestorage";

export const ViewTransactionsPage = () => {
    const remoteStorageSvc = useAtomValue(storageServiceAtom);
    const [monthlyTransactions, setMonthlyTransactions] = useState<BatchReadResult[]>([]);
    const { scrollRef, snapPointIndexes, next, prev, hasPrevPage, hasNextPage, activePageIndex } = useSnapCarousel();
    useEffect(() => {
        if (remoteStorageSvc && remoteStorageSvc.kind === 'remote-storage-service') {
            const now = dayjs();
            const query = Array.from({ length: 3 }).map((_, idx) => ({
                year: now.month() - idx < 0 ? now.year() - 1 : now.year(),
                month: now.month() - idx < 0 ? now.month() - idx + 12 : now.month() - idx,
            }));
            remoteStorageSvc.batchReadMonths(query)
                .then(res => {
                    res.sort((a, b) => a.year === b.year ? b.month - a.month : b.year - a.year);
                    setMonthlyTransactions(res);
                });
        }
    }, [remoteStorageSvc]);
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
            <Typography>{dayjs(new Date(monthlyTransactions[activePageIndex].year, monthlyTransactions[activePageIndex].month, 0)).format('YYYY MMM')}</Typography>
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
                        <img
                            src={`https://picsum.photos/500?${i}`}
                            width="250"
                            height="250"
                            alt={`Item ${i}`}
                        />
                    </Box>
                ))}
            </Stack>
        </>
    );
};
