import { useEffect, useState } from 'react'
import './App.css'
import { Alert, BottomNavigation, BottomNavigationAction, Box, CircularProgress, Paper, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { storageServiceAtom, storageStateAtom } from './atom/storage';
import { appConfigAtom } from './atom/config';
import { InsertTransactionPage } from './page/InsertTransactionPage';
import { InsightsPage } from './page/InsigthsPage';
import { ViewTransactionsPage } from './page/ViewTransactionsPage';
import { ImportTransactionsPage } from './page/ImportTransactionsPage';

function App() {
  const remoteStorageService = useAtomValue(storageServiceAtom);
  const setRemoteStorageState = useSetAtom(storageStateAtom);
  const [appConfig, setAppConfig] = useAtom(appConfigAtom);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (remoteStorageService && remoteStorageService.kind === 'remote-storage-initializer') {
      remoteStorageService.initialize(appConfig).then(([state, config]) => {
        setRemoteStorageState(state);
        setAppConfig(config);
      });
    }
  }, [remoteStorageService]);

  if (!remoteStorageService) {
    return <Alert>Internal error</Alert>;
  } else if (remoteStorageService.kind === 'remote-storage-initializer') {
    return <Stack alignItems="center" justifyContent="center" sx={{ height: '100vh' }}><CircularProgress /></Stack>;
  }

  return (
    <Box sx={{ width: '100%', height: '100vh' }}>
      <PageRouter pageIdx={value} />
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
          showLabels
          value={value}
          onChange={(_event, newValue) => {
            setValue(newValue);
          }}
        >
          <BottomNavigationAction label="Insert" value={0} icon={<EditIcon />} />
          {appConfig.conf.experimentalFeatures ? <BottomNavigationAction label="Import" value={1} icon={<FileUploadOutlinedIcon />} /> : null}
          <BottomNavigationAction label="Report" value={2} icon={<LibraryBooksIcon />} />
          <BottomNavigationAction label="Insights" value={3} icon={<ShowChartIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

const PageRouter = (p: { pageIdx: number }) =>
  p.pageIdx === 0 ? <InsertTransactionPage />
    : p.pageIdx === 1 ? <ImportTransactionsPage />
      : p.pageIdx === 2 ? <ViewTransactionsPage />
        : p.pageIdx === 3 ? <InsightsPage />
          : null;

export default App
