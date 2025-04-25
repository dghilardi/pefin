import { useEffect, useState } from 'react'
import './App.css'
import { Alert, BottomNavigation, BottomNavigationAction, Box, CircularProgress, Paper, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useAtomValue, useSetAtom } from 'jotai';
import { storageServiceAtom, storageStateAtom } from './atom/storage';

function App() {
  const remoteStorageService = useAtomValue(storageServiceAtom);
  const setRemoteStorageState = useSetAtom(storageStateAtom);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (remoteStorageService && remoteStorageService.kind === 'remote-storage-initializer') {
      remoteStorageService.initialize().then(setRemoteStorageState);
    }
  }, [remoteStorageService]);

  if (!remoteStorageService) {
    return <Alert>Internal error</Alert>;
  } else if (remoteStorageService.kind === 'remote-storage-initializer') {
    return <Stack alignItems="center" justifyContent="center" sx={{ height: '100vh' }}><CircularProgress /></Stack>;
  }

  return (
    <Box sx={{ width: '100%', height: '100vh' }}>

      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
          showLabels
          value={value}
          onChange={(_event, newValue) => {
            setValue(newValue);
          }}
        >
          <BottomNavigationAction label="Insert" icon={<EditIcon />} />
          <BottomNavigationAction label="Report" icon={<LibraryBooksIcon />} />
          <BottomNavigationAction label="Insights" icon={<ShowChartIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

export default App
