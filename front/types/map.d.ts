interface ReverseGeocodeAddressResult
{
    Match_addr: string;
}

interface MapDictionary
{
    [x:string]: {map: L.Map, marker: L.Marker}
}

interface NearbyResult
{
    text: string;
    bounds: L.LatLngBoundsExpression;
    score: number;
    latlng: L.LatLngExpression;
    properties: {[x: string]: any};
}
