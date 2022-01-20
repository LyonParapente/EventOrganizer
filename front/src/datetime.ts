import settings from './settings';
import { i18n } from './trads';

export function toDateString (date: Date): string
{
	var YYYY = date.getFullYear(),
		MM = date.getMonth() + 1,
		DD = date.getDate()/*,
		hh = date.getHours(),
		mm = date.getMinutes(),
		ss = date.getSeconds(),
		ms = date.getMilliseconds()*/;

	var year = YYYY.toString(),
		month = MM < 10 ? '0' + MM.toString() : MM.toString(),
		day = DD < 10 ? '0' + DD.toString() : DD.toString()/*,
		hours = hh < 10 ? '0' + hh.toString() : hh.toString(),
		minutes = mm < 10 ? '0' + mm.toString() : mm.toString(),
		seconds = ss < 10 ? '0' + ss.toString() : ss.toString(),
		milliseconds = ms < 10 ? '00' + ms.toString() : (ms < 100 ? '0' + ms : ms.toString())*/;
	return year+"-"+month+"-"+day/*+" "+hours+":"+minutes+":"+seconds+"."+milliseconds*/;
}

export function toTimeString (date: Date): string
{
	var hh = date.getHours(),
		mm = date.getMinutes();

	var hours = hh < 10 ? '0' + hh.toString() : hh.toString(),
		minutes = mm < 10 ? '0' + mm.toString() : mm.toString();
	return hours+"h"+minutes;
}

export function toRelativeTimeString (date: Date): string
{
	var now = new Date();
	var nowMinus1Day = new Date(now.getTime() - 86400000);

	var today = toDateString(date) === toDateString(now);
	var yesterday = toDateString(date) === toDateString(nowMinus1Day);

	if (today)
	{
		return i18n('Today ') + i18n(' at ') + toTimeString(date);
	}
	else if (yesterday)
	{
		return i18n('Yesterday ') + i18n(' at ') + toTimeString(date);
	}
	else
	{
		var dateStr = new Intl.DateTimeFormat(settings.lang).format(date);
		return i18n('The ') + dateStr + i18n(' at ') + toTimeString(date);
	}
}
