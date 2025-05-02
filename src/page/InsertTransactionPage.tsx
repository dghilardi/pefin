import { Alert, AlertColor, Button, FormControl, FormHelperText, InputLabel, MenuItem, Select, Snackbar, Stack, TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useFormik } from 'formik';
import { useAtomValue } from 'jotai';
import * as yup from 'yup';
import { appConfigAtom } from '../atom/config';
import { NumericFormat } from 'react-number-format';
import { storageServiceAtom } from '../atom/storage';
import { useState } from 'react';

export const InsertTransactionPage = () => {
    const { conf: appConfig } = useAtomValue(appConfigAtom);
    const remoteStorageSvc = useAtomValue(storageServiceAtom);
    const [snackbarState, setSnackbarState] = useState<{ open: boolean, message: string, severity: AlertColor }>({ open: false, message: '', severity: 'success' });
    const [submittingTransaction, setSubmittingTransaction] = useState(false);
    if (!remoteStorageSvc || remoteStorageSvc.kind !== 'remote-storage-service') {
        return <Alert>Remote service not initialized</Alert>;
    }

    const validationSchema = yup.object({
        notes: yup.string(),
        category: yup.number()
            .required(),
        amount: yup.number()
            .moreThan(0)
            .required()
    });

    type FormData = {
        notes: string,
        category: string,
        amount: number | string,
        transactionDate: Dayjs
    };

    const formik = useFormik<FormData>({
        initialValues: {
            notes: '',
            category: '',
            amount: '',
            transactionDate: dayjs()
        },
        validationSchema,
        onSubmit: async (values, { resetForm }) => {
            try {
                setSubmittingTransaction(true);
                const category = appConfig.categories[Number(values.category)];
                await remoteStorageSvc.insertMovement(values.transactionDate, category, values.notes, Number(values.amount));
                setSnackbarState({ open: true, message: 'Transaction inserted', severity: 'success' });
                resetForm();
            } catch (err) {
                setSnackbarState({ open: true, message: 'Error inserting transaction', severity: 'error' });
            } finally {
                setSubmittingTransaction(false);
            }
        }
    });

    const handleSnackbarClose = () => setSnackbarState({ open: false, message: '', severity: 'success' });
    return <>
        <Snackbar
            open={snackbarState.open}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            onClose={handleSnackbarClose}
            autoHideDuration={3000}
            message={snackbarState.message}
        >
            <Alert
                severity={snackbarState.severity}
                onClose={handleSnackbarClose}
            >{snackbarState.message}</Alert>
        </Snackbar>
        <form style={{ height: 'calc(100% - 56px)' }} onSubmit={formik.handleSubmit}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Stack spacing={2} width={"100%"} padding={2} alignContent="center" justifyContent="center" height="100%">
                    <DatePicker
                        name="transactionDate"
                        label="Transaction Date"
                        format='DD/MM/YYYY'
                        value={formik.values.transactionDate}
                        onChange={(val) => formik.setFieldValue('transactionDate', val)}
                    />
                    <FormControl error={formik.touched.category && Boolean(formik.errors.category)}>
                        <InputLabel id="category-label">Category</InputLabel>
                        <Select
                            fullWidth
                            label="Category"
                            labelId="category-label"
                            id="category"
                            name="category"
                            value={formik.values.category}
                            onChange={formik.handleChange}
                        >
                            {appConfig.categories.map((cat, idx) => ({ cat, idx })).filter(({ cat }) => !cat.readonly).map(({cat, idx}) => <MenuItem key={idx} value={`${idx}`} >{`${cat.group} - ${cat.name}`}</MenuItem>)}
                        </Select>
                        <FormHelperText>{formik.touched.category && formik.errors.category}</FormHelperText>
                    </FormControl>
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
                    <FormControl>
                        <NumericFormat
                            id="amount"
                            name="amount"
                            label="Amount"
                            error={formik.touched.amount && Boolean(formik.errors.amount)}
                            value={formik.values.amount}
                            onValueChange={({ floatValue }) => formik.setFieldValue('amount', floatValue)}
                            onBlur={formik.handleBlur}
                            thousandSeparator
                            valueIsNumericString={false}
                            prefix="€"
                            allowLeadingZeros={false}
                            allowNegative={false}
                            fixedDecimalScale
                            decimalScale={2}
                            customInput={TextField}
                        />
                        <FormHelperText>{formik.touched.amount && formik.errors.amount}</FormHelperText>
                    </FormControl>
                    <Button
                        color="primary"
                        variant="contained"
                        fullWidth
                        type="submit"
                        size="large"
                        loading={submittingTransaction}
                        disabled={!(formik.isValid && formik.dirty)}
                    >
                        Submit
                    </Button>
                </Stack>
            </LocalizationProvider>
        </form>
    </>;
}