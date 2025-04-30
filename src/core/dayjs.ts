import dayjs from 'dayjs';

import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/it'

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

dayjs.tz.setDefault("Europe/Rome");

export default dayjs;