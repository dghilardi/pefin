import { Button, MenuItem, Select, Stack, TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { useAtomValue } from 'jotai';
import * as yup from 'yup';
import { appConfigAtom } from '../atom/config';

export const InsertTransactionPage = () => {
    const appConfig = useAtomValue(appConfigAtom);
    const validationSchema = yup.object({
        notes: yup.string(),
        category: yup.string()
            .oneOf(appConfig.categories.map(c => c.name))
            .required(),
        amount: yup.number()
            .moreThan(0)
            .required()
    });

    const formik = useFormik({
        initialValues: {
            notes: '',
            category: '',
            amount: 0,
            transactionDate: dayjs()
        },
        validationSchema,
        onSubmit: values => {
            console.log(values);
        }
    });

    return <form onSubmit={formik.handleSubmit} >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={2} width={"100%"} padding={2}>
                <DatePicker
                    name="transactionDate"
                    label="Transaction Date"
                    format='DD/MM/YYYY'
                    value={formik.values.transactionDate}
                    onChange={formik.handleChange}
                />
                <Select
                    fullWidth
                    label="Category"
                    labelId="category"
                    id="category"
                    name="category"
                    value={formik.values.category}
                    onChange={formik.handleChange}
                    error={formik.touched.category && Boolean(formik.errors.category)}
                >
                    {appConfig.categories.map(cat => <MenuItem key={cat.name} value={cat.name} >{cat.name}</MenuItem>)}
                </Select>
                <TextField
                    fullWidth
                    id="notes"
                    name="notes"
                    label="Notes"
                    value={formik.values.notes}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.notes && Boolean(formik.errors.notes)}
                    helperText={formik.touched.notes && formik.errors.notes}
                />
                <TextField
                    fullWidth
                    id="amount"
                    name="amount"
                    label="Amount"
                    value={formik.values.amount}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.amount && Boolean(formik.errors.amount)}
                    helperText={formik.touched.amount && formik.errors.amount}
                />
                <Button color="primary" variant="contained" fullWidth type="submit">
                    Submit
                </Button>
            </Stack>
        </LocalizationProvider>
    </form>;
}