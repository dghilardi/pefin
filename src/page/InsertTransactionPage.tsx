import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export const InsertTransactionPage = () => {
    return <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker />
    </LocalizationProvider>;
}