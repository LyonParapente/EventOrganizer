export default function get_connected_user (): ConnectedUser
{
	// @ts-ignore
	return window['connected_user'] as ConnectedUser;
}
