---
title: "Worked examples"
sidebar_label: "Overview"
sidebar_position: 0
description: "Thirty-one real public datasets mapped to NGSI-LD end to end, each example adding one idea to the ones before it."
keywords: ["NGSI-LD", "worked example", "Smart Data Models", "data transformation"]
---

# Worked examples

Each example maps one real public dataset from beginning to end: where the data comes from, the mapping that shapes it, the command that runs it, and the entities that come out. The order is a reading order, so each one builds on the ones before it.

The mappings, manifests, and schemas themselves live in [vela-tools/cassiopeia-examples](https://github.com/vela-tools/cassiopeia-examples), where a runner executes every example and checks its output against what its page claims.

**[JSON field mapping](./01-json-field-mapping/index.md)** → `ChemicalElement`

Map a JSON array to ChemicalElement entities and type one copied field as a number.

**[ID collisions](./02-json-id-collision/index.md)** → `City`

See how a weak city ID merges records, then add a geohash from the coordinates.

**[GeoJSON Smart Data Model](./03-geojson-smart-data-model/index.md)** → `OffStreetParking`

Map GeoJSON to OffStreetParking and validate it against the published schema.

**[CSV conditionals](./04-csv-conditionals/index.md)** → `BikeHireDockingStation`

Read a semicolon-delimited CSV, translate codes, and build an address object.

**[Attribute guards](./05-geojson-attribute-guards/index.md)** → `OffStreetParking`

Combine conditional values with constants and omit invalid source values.

**[Messy CSV headers](./06-csv-messy-headers/index.md)** → `MonthlyPrecipitationObserved`

Address unusual Latin-1 CSV headers and parse comma decimals.

**[observedAt observations](./07-csv-observed-at/index.md)** → `GoldPriceObserved`

Keep monthly measurements under one entity ID with observedAt.

**[LanguageProperty](./08-json-language-property/index.md)** → `Region`

Build a LanguageProperty and read a hyphenated source key.

**[Manifests](./09-csv-manifest/index.md)** → `Airport` `Airline`

Use a manifest to map two headerless CSV files in one run.

**[JSON relationships](./10-json-relationships/index.md)** → `Region` `Subregion` `Country` `State`

Connect region, subregion, country, and state entities.

**[CSV relationship graph](./11-csv-relationship-graph/index.md)** → `Flight` `Airport` `Airline` `AircraftModel` `Country`

Link routes, airports, airlines, aircraft models, and countries.

**[ListRelationship](./12-csv-list-relationship/index.md)** → `Flight` `Airport` `Airline` `AircraftModel` `Country`

Use a ListRelationship when one route has several aircraft models.

**[Synthetic entities](./13-json-synthetic-entities/index.md)** → `Mountain` `Country`

Create country entities from a mountain's country field.

**[XML unit codes](./14-xml-unit-code/index.md)** → `WeatherObserved`

Map XML measurements with unitCode and observedAt.

**[Shapefile enums](./15-shapefile-enum-decoding/index.md)** → `Port`

Read a zipped shapefile and decode its coded columns.

**[KMZ namespacing](./16-kmz-folder-namespacing/index.md)** → `ParkPointOfInterest`

Package a KML as a KMZ, namespace its records by folder, and pass placemark geometry through.

**[KML collections](./17-kml-folder-collections/index.md)** → `CitiBikeStation` `BikeRentalShop` `Sightseeing` `PublicRestroom`

Route four KML folders to four mappings.

**[GRIB1 derived values](./18-grib1-derived-values/index.md)** → `WeatherObserved`

Derive weather values from GRIB1 components.

**[GRIB2 byte ranges](./19-grib2-byte-range/index.md)** → `WeatherObserved`

Fetch selected GRIB2 fields by byte range.

**[Local @context](./20-csv-at-context/index.md)** → `ExoPlanet` `Star`

Define a JSON-LD context for an invented model, and materialise its host star as a second entity.

**[JSON datasetId](./21-json-dataset-id/index.md)** → `WeatherForecast`

Keep forecasts from several models under one attribute.

**[Temporal to broker](./22-csv-broker-temporal/index.md)** → `TropicalCyclone`

Fold a track and deliver it to Scorpio.

**[Scheduling](./23-json-scheduling/index.md)** → `AirQualityObserved`

Poll a sensor feed and upsert entities on a schedule.

**[ListProperty](./24-json-list-property/index.md)** → `BicycleCounter`

Store hourly counts in an ordered ListProperty.

**[JsonProperty](./25-geojson-json-property/index.md)** → `WeatherAlert`

Keep an alert's changing parameters object in a JsonProperty.

**[VocabProperty](./26-csv-vocab-property/index.md)** → `UrbanMobilityPoint`

Turn an OpenStreetMap tag into a VocabProperty IRI.

**[Custom schemas](./27-csv-custom-schema/index.md)** → `ExoPlanet` `Star`

Validate two invented models against two local JSON Schemas in one run.

**[Advanced schema validation](./28-json-advanced-schema/index.md)** → `FoodProduct`

Validate wrappers and metadata in normalized output.

**[Multi-attribute relationships](./29-csv-multi-attribute-relationship/index.md)** → `Flight` `Airport` `Airline` `AircraftModel` `Country`

Give a Flight one servesAirport name for its departure and arrival airports, distinguished by datasetId.

**[Nested relationships](./30-csv-nested-relationship/index.md)** → `Movie`

Give a Movie's hasLeadActor relationship a nested playsCharacter relationship and a billingOrder property.

**[Geometry conversion](./31-geojson-geometry-conversion/index.md)** → `Region`

Demote an administrative region's MultiPolygon to the largest Polygon and derive a map-pin centroid beside it.
