interface Comment
{
	date: string;
	user: number;
	comment: string;
}

interface User
{
	firstname: string;
	lastname: string;
	phone?: string;
	has_whatsapp?: boolean;
	email?: string;
}

interface UsersDictionary
{
	[x: string]: User;
}

interface RegistrationInfos
{
	badge: string,
	title: string,
	button: string,
	buttonMsg: string,
	buttonDelMsg: string,
	interest: number
}
