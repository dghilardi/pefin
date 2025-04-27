import { Alert, Box, Stack, Typography } from "@mui/material";
import { FileUploader } from "react-drag-drop-files";
import * as XLSX from "xlsx";
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import dayjs from "dayjs";
import { useAtomValue } from "jotai";
import { storageServiceAtom } from "../atom/storage";
import { TransactionData } from "../service/remotestorage";
import { appConfigAtom } from "../atom/config";

export const ImportTransactionsPage = () => {
    const appConfig = useAtomValue(appConfigAtom);
    const remoteStorageSvc = useAtomValue(storageServiceAtom);
    if (!remoteStorageSvc || remoteStorageSvc.kind !== 'remote-storage-service') {
        return <Alert>Remote service not initialized</Alert>;
    }

    const importFile = async (file: File) => {
        const importedData = await new Promise<Record<string, string>[]>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                if (
                    file.type ===
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                    file.type === "application/vnd.ms-excel"
                ) {
                    console.log(e.target?.result);
                    const workbook = XLSX.read(e.target?.result, { type: "binary" });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    worksheet["!ref"] = 'A1:Z1000';
                    const jsonData = XLSX.utils.sheet_to_json<Record<number, string>>(worksheet, { raw: true, header: ['0', '1', '2', '3', '4', '5', '6', '7', '8'] });
                    resolve(jsonData);
                } else {
                    reject("Unsupported file type");
                }
            }
            reader.readAsArrayBuffer(file);
        });

        // Try ISP format
        const transactionRows = importedData
            .filter(r => {
                const day = Number(r['0']);
                return day > 0 && day < 200 * 365;
            })
            .map((row): TransactionData => ({
                date: dayjs(new Date(1900, 0, 0)).add(Number(row['0']), 'day'),
                notes: row['1'],
                details: row['2'],
                sourceAccount: Number(row['7']) > 0 ? '' : row['3'],
                destAccount: Number(row['7']) > 0 ? row['3'] : '',
                category: row['5'],
                currency: row['6'],
                type: Number(row['7']) > 0 ? 'income' : 'expense',
                amount: Math.abs(Number(row['7'])),
            }))
            .map(row => {
                const patch = appConfig.import.rewrites.find(r => 
                    (!r.query.category || row.category.match(new RegExp(r.query.category)))
                    && (!r.query.details || row.details.match(new RegExp(r.query.details)))
                    && (!r.query.notes || row.notes.match(new RegExp(r.query.notes)))
                    && (!r.query.type || row.type.match(new RegExp(r.query.type)))
                )?.patch;
                if (patch) {
                    if (patch.notes) row.notes = patch.notes;
                    if (patch.details) row.details = patch.details;
                    if (patch.sourceAccount) row.sourceAccount = patch.sourceAccount;
                    if (patch.destAccount) row.destAccount = patch.destAccount;
                    if (patch.group) row.group = patch.group;
                    if (patch.category) row.category = patch.category;
                    if (patch.type) row.type = patch.type as 'income' | 'expense' | 'transfer';
                }
                return row;
            });
            remoteStorageSvc.batchImportTransactions(transactionRows);
    };

    return <Stack
        height="100%"
        width="100%"
        alignContent="center"
        justifyContent="center"
    >
        <FileUploader height="40%" handleChange={importFile} name="file" types={["xlsx"]}>
            <Box
                sx={{
                    width: "100%",
                    height: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    margin: "2"
                }}
            >
                <FileUploadOutlinedIcon />
                <Typography>Import transactions dump</Typography>
            </Box>
        </FileUploader>
    </Stack>;
}