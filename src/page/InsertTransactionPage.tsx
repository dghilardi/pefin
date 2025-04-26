import { Button, FormControl, FormHelperText, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { useAtomValue } from 'jotai';
import * as yup from 'yup';
import { appConfigAtom } from '../atom/config';
import { NumericFormat } from 'react-number-format';

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
            amount: undefined,
            transactionDate: dayjs()
        },
        validationSchema,
        onSubmit: values => {
            console.log(values);
        }
    });

    return <form style={{ height: 'calc(100% - 56px)' }} onSubmit={formik.handleSubmit}>
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
                        {appConfig.categories.map(cat => <MenuItem key={cat.name} value={cat.name} >{cat.name}</MenuItem>)}
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
                <Button color="primary" variant="contained" fullWidth type="submit" size="large" disabled={!(formik.isValid && formik.dirty)}>
                    Submit
                </Button>
            </Stack>
        </LocalizationProvider>
    </form>;
}