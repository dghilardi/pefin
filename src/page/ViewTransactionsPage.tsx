import { Box, IconButton, Stack } from "@mui/material";
import { useSnapCarousel } from "react-snap-carousel";
import ArrowCircleRightRoundedIcon from '@mui/icons-material/ArrowCircleRightRounded';
import ArrowCircleLeftRoundedIcon from '@mui/icons-material/ArrowCircleLeftRounded';

export const ViewTransactionsPage = () => {
    return <Carousel />;
}

export const Carousel = () => {
    const { scrollRef, snapPointIndexes, next, prev, hasPrevPage, hasNextPage } = useSnapCarousel();
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
                ref={scrollRef}
            >
                {Array.from({ length: 18 }).map((_, i) => (
                    <Box
                        key={i}
                        display="block"
                        width="100%"
                        flexShrink={0}
                        sx={{
                            scrollSnapAlign: snapPointIndexes.has(i) ? "start" : "",
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
            <IconButton
                sx={{
                    position: 'absolute',
                    left: 0,
                }}
                disabled={!hasPrevPage}
                onClick={() => prev()}
            >
                <ArrowCircleLeftRoundedIcon />
            </IconButton>
            <IconButton
                sx={{
                    position: 'absolute',
                    right: 0,
                }}
                disabled={!hasNextPage}
                onClick={() => next()}
            >
                <ArrowCircleRightRoundedIcon />
            </IconButton>
        </>
    );
};
