const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errorHandler');

// Build a search query based on action type + item category
const getSearchQuery = (action, category, name) => {
  const cat = (category || '').toLowerCase();

  if (action === 'donate') {
    const queries = {
      electronics: 'electronics donation center charity',
      wearables: 'clothing donation center thrift store charity',
      household: 'furniture donation center charity shop',
      recreational: 'sports equipment donation center charity',
    };
    return queries[cat] || 'donation center charity shop';
  }

  if (action === 'recycle') {
    const queries = {
      electronics: 'e-waste recycling center electronics recycling',
      wearables: 'textile recycling clothing recycling center',
      household: 'recycling center scrap metal',
      recreational: 'recycling center',
    };
    return queries[cat] || 'recycling center';
  }

  // default: repair
  const queries = {
    electronics: 'electronics repair shop',
    wearables: 'clothing alteration tailor shoe repair',
    household: 'appliance furniture repair shop',
    recreational: 'sports equipment repair shop',
  };
  return queries[cat] || `${name || ''} repair shop`.trim();
};

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { lat, lng, category, name, action } = req.body;

    if (!lat || !lng) {
      const err = new Error('Request must include "lat" and "lng" coordinates.');
      err.statusCode = 400;
      throw err;
    }

    if (!process.env.MAPS_API_KEY) {
      const err = new Error('Missing environment variable: MAPS_API_KEY');
      err.statusCode = 500;
      throw err;
    }

    const searchQuery = getSearchQuery(action, category, name);
    console.log(`[nearby-shops] action=${action} query="${searchQuery}"`);

    // ── Google Maps Places API (New) — Text Search ────────────────
    const placesUrl = 'https://places.googleapis.com/v1/places:searchText';

    const placesResponse = await fetch(placesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.MAPS_API_KEY,
        'X-Goog-FieldMask': [
          'places.displayName',
          'places.formattedAddress',
          'places.rating',
          'places.userRatingCount',
          'places.currentOpeningHours',
          'places.googleMapsUri',
          'places.internationalPhoneNumber',
        ].join(','),
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 5000.0, // 5km radius
          },
        },
        maxResultCount: 5,
      }),
    });

    if (!placesResponse.ok) {
      const errorBody = await placesResponse.text();
      console.error('[nearby-shops] Maps API error:', errorBody);
      const err = new Error('Failed to fetch nearby shops. Please try again.');
      err.statusCode = 502;
      throw err;
    }

    const placesData = await placesResponse.json();
    const places = placesData.places || [];

    const shops = places.map((place) => ({
      name: place.displayName?.text || 'Unknown Shop',
      address: place.formattedAddress || 'Address not available',
      rating: place.rating ?? null,
      reviews: place.userRatingCount ?? 0,
      open: place.currentOpeningHours?.openNow ?? null,
      phone: place.internationalPhoneNumber || null,
      mapsUrl: place.googleMapsUri || `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`,
    }));

    res.json({ success: true, shops });
  })
);

module.exports = router;
