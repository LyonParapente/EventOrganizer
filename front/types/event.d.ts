
interface CurrentEvent
{
	event_id: number;
	creator_id: number;
	isFinished: boolean;
	whatsapp_link: string;
}

interface EditedEvent
{
	id: number,
	creator_id: number,
	title: string,
	start_date: Date,
	end_date: Date,
	/*
	time: string,
	description: string,
	location: string,
	gps: string,
	gps_location: string,
	category: string,
	color: string,
	whatsapp_link: string,
	creation_datetime: string
	*/
}