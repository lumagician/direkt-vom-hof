# direkt-vom-hof

## overpass queries

### fetch all farm shops

```
/*
This query looks for nodes, ways and relations 
with the given key/value combination.
Choose your region and hit the Run button above!
*/
[out:json][timeout:25];
// gather results
nwr["shop"="farm"]({{bbox}});
// print results
out geom;
```
https://overpass-turbo.eu/?template=key-value&key=shop&value=farm
