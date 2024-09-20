
import React, { useState, useEffect } from 'react';
import Autosuggest from 'react-autosuggest';
import axios from 'axios';
import { CSSTransition } from 'react-transition-group';
import { PacmanLoader } from 'react-spinners';
import './home.css';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Modal from 'react-modal'; 
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Home = () => {
  const [user,setUser] = useState('')
  const [page, setPage] = useState(0);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [travelType, setTravelType] = useState('');
  const [categories, setCategories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState([]);
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [savedItineraries, setSavedItineraries] = useState([])
  const [planmain, setplanmain] = useState([])
  const [modalIsOpen, setModalIsOpen] = useState(false);
  
  const [selectedItinerary, setSelectedItinerary] = useState(null);


  const travelOptions = ['Solo', 'Partner', 'Family'];
  const categoryOptions = ['Must See Attractions', 'Food', 'Nightlife', 'Historical Places', 'Beach Life', 'Theatre', 'Cultural', 'Clubs/Bars'];
  const fetchSuggestions = async (value) => {
    try {
      const response = await axios.get('https://place-autocomplete1.p.rapidapi.com/autocomplete/json', {
        params: { input: value, radius: 500 },
        headers: {
          'x-rapidapi-key': process.env.REACT_APP_RAPIDAPI_KEY,
          'x-rapidapi-host': 'place-autocomplete1.p.rapidapi.com'
        }
      });
      setSuggestions(response.data.predictions.map(pred => pred.description));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };
  const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const fetchGeocoding = async (location) => {
    try {
      const response = await axios.get('https://map-geocoding.p.rapidapi.com/json', {
        params: { address: location },
        headers: {
          'x-rapidapi-key': process.env.REACT_APP_RAPIDAPI_KEY,
          'x-rapidapi-host': 'map-geocoding.p.rapidapi.com'
        }
      });
      const { lat, lng } = response.data.results[0].geometry.location;
      console.log('latitude', lat)
      console.log('longitude', lng)
      return { lat, lng };
    } catch (error) {
      console.error('Error fetching geocoding:', error);
      return { lat: null, lng: null };
    }
  };
  
  useEffect(() => {
    const fetchUserAndItineraries = async () => {
      try {
        const token = localStorage.getItem('token');
        
        console.log('Token:', token);
  
        const response = await fetch('http://localhost:5000/api/itinerary/user', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
  
        if (response.ok) {
          const contentType = response.headers.get('Content-Type');
          console.log('Content-Type:', contentType);
  
          if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
            console.log('Result:', result);
  
            const user = localStorage.getItem('user');
            console.log('Stored User:', user);
            setUser(user);
  
            setSavedItineraries(result);
          } else {
            const text = await response.text();
            console.error('Response is not JSON:', text);
          }
        } else {
          console.error('Failed to fetch itineraries:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching itineraries:', error);
      }
    };
  
    fetchUserAndItineraries();
  }, []);
  
  
  
  const fetchFlights = async (source, destination) => {
    try {
      const response = await axios.get('https://tripadvisor16.p.rapidapi.com/api/v1/flights/searchFlights', {
        params: {
          sourceAirportCode: source,
          destinationAirportCode: destination,
          date: fromDate,
          itineraryType: 'ONE_WAY',
          sortOrder: 'ML_BEST_VALUE',
          numAdults: 1,
          numSeniors: 0,
          classOfService: 'ECONOMY',
          pageNumber: 1,
          nearby: 'yes',
          nonstop: 'yes',
          currencyCode: 'INR',
          region: 'USA'
        },
        headers: {
          'x-rapidapi-key': process.env.REACT_APP_RAPIDAPI_KEY_2,
          'x-rapidapi-host': 'tripadvisor16.p.rapidapi.com'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching flights:', error);
      return [];
    }
  };

  const fetchIATA = async (lat, lng) => {
    try {
      const response = await axios.get('https://aviation-reference-data.p.rapidapi.com/airports/search', {
        params: {
          lat,
          lon: lng,
          radius: 100
        },
        headers: {
          'x-rapidapi-key': process.env.REACT_APP_RAPIDAPI_KEY,
          'x-rapidapi-host': 'aviation-reference-data.p.rapidapi.com'
        }
      });
      return response.data; 
    } catch (error) {
      console.error('Error fetching IATA codes:', error);
      return [];
    }
  };


  const fetchHotels = async (lat, lng) => {
    try {
      const response = await axios.get('https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotelsByLocation', {
        params: {
          latitude: lat,
          longitude: lng,
          checkIn: fromDate,
          checkOut: toDate,
          pageNumber: 1,
          currencyCode: 'INR'
        },
        headers: {
          'x-rapidapi-key': process.env.REACT_APP_RAPIDAPI_KEY_2,
          'x-rapidapi-host': 'tripadvisor16.p.rapidapi.com'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching hotels:', error);
      return [];
    }
  };

  const generateItinerary = async () => {
    setLoading(true);  
    try {
      console.log('Generating itinerary...');
      const response = await model.generateContent(
        `Generate a very detailed itinerary for a trip to ${toLocation} between ${fromDate} and ${toDate} for a ${travelType} trip. The traveler is interested in ${categories.join(', ')}.
     
        For each day, provide a detailed plan that includes:
     
        - Day 1:
          ** Morning: Visit [First Attraction]. This site is famous for its [specific architectural feature or historical significance]. 
          ** Afternoon: Explore [Second Attraction]. Known for its [unique feature or cultural significance].
          ** Evening: Enjoy dinner at [Restaurant/Area]. Renowned for its [type of cuisine or dining experience]. 
        --------------------------------------------------------------------
        - Day 2:
          ** Morning: Visit [Third Attraction]. This place is celebrated for [describe what makes it special].
          ** Afternoon: Spend time at [Fourth Attraction]. Known for its [cultural significance or unique aspect].
          ** Evening: Dine at [Restaurant/Area].
        --------------------------------------------------------------------- 
        ADD A THEEVENTENDSHERE for each event and THEDAYENDSHERE after each day ends`
      );
  
      console.log('Response:', response);
  
      if (response && response.response && response.response.candidates && response.response.candidates.length > 0) {
        const generatedContent = response.response.candidates[0].content.parts[0].text;
        console.log('Generated Content:', generatedContent);
        const structuredPlan = parsePlan(generatedContent);
        console.log('Structured Plan:', structuredPlan);
        return structuredPlan;
      } else {
        setError('Failed to generate the itinerary. Please try again.');
        return [];
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
      setError('An error occurred while generating the itinerary.');
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  
  
  const handleSaveItinerary = async () => {
    if (!planmain || Object.keys(planmain).length === 0) {
      alert('No itinerary to save');
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No token found. Please log in again.');
        return;
      }
      console.log('planmain in 246', planmain)

      const response = await fetch('http://localhost:5000/api/itinerary/save-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(planmain), 
      });
  
      const result = await response.json();
  
      if (response.ok) {
        alert('Itinerary saved successfully');
      } else {
        throw new Error(result.msg || 'Failed to save itinerary');
      }
    } catch (error) {
      alert(error.message);
    }
  };
  
  
  
  const parsePlan = (content) => {
    const days = content.split('THEDAYENDSHERE').map(day => day.trim()).filter(day => day.length > 0);
  
    return days.map(day => {
      const events = day.split('THEEVENTENDSHERE').map(event => event.trim()).filter(event => event.length > 0);
      return {
        day: events.shift(),
        events
      };
    });
  };
  
  

  const handleLocationChange = async (e, { newValue }, type) => {
    if (type === 'from') {
      setFromLocation(newValue);
    } else {
      setToLocation(newValue);
    }
  };

  const handleTravelTypeSelection = (option) => {
    setTravelType(option);
  };

  const toggleCategory = (category) => {
    setCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const nextPage = async () => {
    if (page === 0) {
      if (!fromLocation || !toLocation || !fromDate || !toDate) {
        setError('Please fill all fields.');
        return;
      }
      setError('');
      setPage(1);
    } else if (page === 1) {
      setLoading(true);
      try {
        const fromLocationData = await fetchGeocoding(fromLocation);
        console.log('fromlocation data', fromLocationData);
        const toLocationData = await fetchGeocoding(toLocation);
  
        const fromIATAData = await fetchIATA(fromLocationData.lat, fromLocationData.lng);
        console.log('fromIATA', fromIATAData);
  
        const toIATAData = await fetchIATA(toLocationData.lat, toLocationData.lng);
        console.log('toIATA', toIATAData);
  
        const fromIATA = fromIATAData[0]?.iataCode || 'Unknown';
        const toIATA = toIATAData[0]?.iataCode || 'Unknown';
  
        const flightsData = await fetchFlights(fromIATA, toIATA);
        console.log('flightdata', flightsData.data.flights[0]);
  
        const hotelsData = await fetchHotels(toLocationData.lat, toLocationData.lng);
        console.log('hotelsdata', hotelsData.data.data);
  
        setFlights(flightsData);
        setHotels(hotelsData.data.data);
        const transformedFlights = flightsData.data.flights.map((flight, index) => ({
          flightName: `Flight ${index + 1}`,
          segments: flight.segments.map((segment, segIndex) => ({
            segmentName: `Segment ${segIndex + 1}`,
            legs: segment.legs.map((leg, legIndex) => ({
              flightNumber: leg.flightNumber,
              operatingCarrier: leg.operatingCarrier.displayName,
            })),
          })),
          totalPrice: flight.purchaseLinks?.[0]?.totalPrice,
        }));

        const transformedHotels = hotelsData.data.data.map(hotel => ({
          id: hotel.id,
          title: hotel.title,
          rating: hotel.bubbleRating.rating,
        }));
        console.log('Calling generateItinerary...');
        const itinerary = await generateItinerary();
        console.log('flights in 346', flights)
        console.log('hotels in 347', hotels)
        console.log('Itinerary:', itinerary);
        
        setPlan(itinerary);
        const plansfull = {
          user: user,
          content: [itinerary],
          flights: transformedFlights,
          hotels: transformedHotels
        }

        console.log('flights in 3499', transformedFlights)
        console.log('hotels in 340923', transformedHotels)
        setplanmain(plansfull)
        setPage(2);
      } catch (error) {
        setError('An error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    }
  };
  console.log('user', user)

  const prevPage = () => {
    setPage(prev => prev - 1);
  };
  console.log('flights', flights)
  console.log('plan at 270', plan)
  
  const openModal = (itinerary) => {
    setSelectedItinerary(itinerary);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setSelectedItinerary(null);
    setModalIsOpen(false);
  };
  return (
    <div className="home-container">
      <header>
        {console.log('saveitineraries in 409', savedItineraries)}
        <h1>Welcome, {user}</h1>
        
    </header>
    <Modal
  isOpen={modalIsOpen}
  onRequestClose={closeModal}
  contentLabel="Itinerary Details"
  ariaHideApp={false}
  style={{
    content: {
      padding: '20px',
      borderRadius: '8px',
      border: 'none',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    },
  }}
>
  <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Itinerary Details</h2>
  {selectedItinerary ? (
    <div>
      {console.log('Selected Itinerary:', selectedItinerary)}
      <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Details for Itinerary {savedItineraries.indexOf(selectedItinerary) + 1}</h3>

      {Array.isArray(selectedItinerary.content) && selectedItinerary.content.length > 0 ? (
        (() => {
          const items = selectedItinerary.content[0];
          return items.map((item, i) => {
            const day = item.day || `Itinerary Part ${i + 1}`;
            return (
              <div key={i} style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '18px', marginBottom: '5px' }}>{day}</h1>
                {Array.isArray(item.events) && item.events.length > 0 ? (
                  item.events.map((event, eventIndex) => (
                    <p key={eventIndex} style={{ margin: '5px 0', fontSize: '16px' }}>{event}</p>
                  ))
                ) : (
                  <p style={{ color: '#888' }}>No events available</p>
                )}
              </div>
            );
          });
        })()
      ) : (
        <p>No content available for this itinerary.</p>
      )}

      <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Flight Details</h3>
      <div style={{ display: 'flex', overflowX: 'auto', gap: '20px', padding: '10px 0' }}>
        {Array.isArray(selectedItinerary.flights) && selectedItinerary.flights.length > 0 ? (
          selectedItinerary.flights.map((flight, index) => {
            const transformedFlight = {
              flightName: `Flight ${index + 1}`,
              segments: flight.segments.map((segment, segIndex) => ({
                segmentName: `Segment ${segIndex + 1}`,
                legs: segment.legs.map((leg) => ({
                  flightNumber: leg.flightNumber,
                  operatingCarrier: leg.operatingCarrier,
                })),
              })),
              totalPrice: `${parseInt(flight.totalPrice, 10) * 80} INR`,
            };

            return (
              <div key={index} style={{ minWidth: '200px', border: '1px solid #ddd', borderRadius: '5px', padding: '10px', backgroundColor: '#f9f9f9' }}>
                {console.log('Flight Data:', transformedFlight)}
                <h4 style={{ fontSize: '18px', marginBottom: '5px' }}>{transformedFlight.flightName}</h4>
                <p style={{ margin: '5px 0' }}>Total Price: {transformedFlight.totalPrice}</p>
                {Array.isArray(transformedFlight.segments) && transformedFlight.segments.length > 0 ? (
                  transformedFlight.segments.map((segment, segIndex) => (
                    <div key={segIndex}>
                      <h5 style={{ fontSize: '16px', marginBottom: '5px' }}>{segment.segmentName}</h5>
                      {Array.isArray(segment.legs) && segment.legs.length > 0 ? (
                        segment.legs.map((leg, legIndex) => (
                          <p key={legIndex} style={{ margin: '5px 0', fontSize: '14px' }}>{`Flight Number: ${leg.flightNumber}, Carrier: ${leg.operatingCarrier}`}</p>
                        ))
                      ) : (
                        <p style={{ color: '#888' }}>No legs available for this segment.</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#888' }}>No segments available for this flight.</p>
                )}
              </div>
            );
          })
        ) : (
          <p>No flights available for this itinerary.</p>
        )}
      </div>

      {/* Hotels */}
      <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Hotel Details</h3>
      <div style={{ display: 'flex', overflowX: 'auto', gap: '20px', padding: '10px 0' }}>
        {Array.isArray(selectedItinerary.hotels) && selectedItinerary.hotels.length > 0 ? (
          selectedItinerary.hotels.map((hotel, index) => (
            <div key={index} style={{ minWidth: '200px', border: '1px solid #ddd', borderRadius: '5px', padding: '10px', backgroundColor: '#f9f9f9' }}>
              {console.log('hotels in 507', hotel)}
              <h4 style={{ fontSize: '18px', marginBottom: '5px' }}>{hotel.title}</h4>
              <p style={{ margin: '5px 0' }}>{`Rating: ${hotel.bubbleRating?.rating || hotel.rating}`}</p>
            </div>
          ))
        ) : (
          <p>No hotels available for this itinerary.</p>
        )}
      </div>
    </div>
  ) : (
    <p>No itinerary selected</p>
  )}
  <button onClick={closeModal} style={{ marginTop: '20px', padding: '10px 15px', fontSize: '16px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
    Close
  </button>
</Modal>




      <CSSTransition
        in={page === 0}
        timeout={500}
        classNames="transition-fade"
        unmountOnExit
      >
        <div className="input-page">
          <h1>Plan Your Trip</h1>
          {loading ? (
            <PacmanLoader size={30} color="#123abc" />
          ) : (
            <div className="input-fields">
              <label>From:</label>
              <Autosuggest
                suggestions={suggestions}
                onSuggestionsFetchRequested={({ value }) =>
                  fetchSuggestions(value)
                }
                onSuggestionsClearRequested={() => setSuggestions([])}
                getSuggestionValue={(suggestion) => suggestion}
                renderSuggestion={(suggestion) => <div>{suggestion}</div>}
                inputProps={{
                  placeholder: 'Enter your departure location',
                  value: fromLocation,
                  onChange: (e, { newValue }) =>
                    handleLocationChange(e, { newValue }, 'from'),
                }}
              />
  
              <label>To:</label>
              <Autosuggest
                suggestions={suggestions}
                onSuggestionsFetchRequested={({ value }) =>
                  fetchSuggestions(value)
                }
                onSuggestionsClearRequested={() => setSuggestions([])}
                getSuggestionValue={(suggestion) => suggestion}
                renderSuggestion={(suggestion) => <div>{suggestion}</div>}
                inputProps={{
                  placeholder: 'Enter your destination location',
                  value: toLocation,
                  onChange: (e, { newValue }) =>
                    handleLocationChange(e, { newValue }, 'to'),
                }}
              />
  
              <label>From Date:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
  
              <label>To Date:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
  
              <div className="nav-buttons">
                <button onClick={nextPage}>Next</button>
              </div>
            </div>
          )}
        </div>
      </CSSTransition>
  
      <CSSTransition
        in={page === 1}
        timeout={500}
        classNames="transition-fade"
        unmountOnExit
      >
        <div className="details-page">
          {loading ? (
            <PacmanLoader size={30} color="#123abc" />
          ) : (
            <>
              <label>Select your travel type:</label>
              <div className="travel-options">
                {travelOptions.map((option) => (
                  <div
                    key={option}
                    className={`travel-option ${
                      travelType === option ? 'selected' : ''
                    }`}
                    onClick={() => handleTravelTypeSelection(option)}
                  >
                    {option}
                  </div>
                ))}
              </div>
  
              <label>Select interests:</label>
              <div className="category-options">
                {categoryOptions.map((option) => (
                  <div
                    key={option}
                    className={`category-option ${
                      categories.includes(option) ? 'selected' : ''
                    }`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={categories.includes(option)}
                      onChange={() => toggleCategory(option)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <label onClick={() => toggleCategory(option)}>{option}</label>
                  </div>
                ))}
              </div>
  
              <div className="nav-buttons">
                <button onClick={prevPage}>Back</button>
                <button onClick={nextPage}>Submit</button>
              </div>
            </>
          )}
        </div>
      </CSSTransition>
  
      <CSSTransition
        in={page === 2}
        timeout={500}
        classNames="transition-fade"
        unmountOnExit
      >
        <div className="results-page">
          <h1>Your Trip Details</h1>
          {loading ? (
            <PacmanLoader size={30} color="#123abc" />
          ) : (
            <>
              {error && <div className="error-message">{error}</div>}
              {plan && plan.length > 0 && (
                <div className="itinerary">
                  <h2>Detailed Itinerary:</h2>
                  {plan.map((dayPlan, index) => (
                    <div key={index} className="day-plan">
                      <h3>{dayPlan.day}</h3>
                      {dayPlan.events.map((event, eventIndex) => (
                        <p key={eventIndex}>{event}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
  
              {flights?.data?.flights?.length > 0 ? (
                <div
                  style={{
                    width: '100vw',
                    overflowX: 'scroll',
                    whiteSpace: 'nowrap',
                    scrollBehavior: 'smooth',
                  }}
                >
                  <div
                    className="flights"
                    style={{
                      display: 'inline-flex',
                      gap: '20px',
                      animation: 'slide 30s linear infinite',
                    }}
                  >
                    {flights.data.flights.map((flight, index) => (
                      <div
                        key={index}
                        className="flight-card"
                        style={{
                          minWidth: '300px',
                          display: 'inline-block',
                          border: '1px solid #ddd',
                          padding: '10px',
                          borderRadius: '8px',
                          flexShrink: 0,
                        }}
                      >
                        <h3>Flight {index + 1}</h3>
                        {flight?.segments?.map((segment, segIndex) => (
                          <div
                            key={segIndex}
                            className="flight-segment"
                            style={{ marginBottom: '10px' }}
                          >
                            <h4>Segment {segIndex + 1}</h4>
                            {segment?.legs?.map((leg, legIndex) => (
                              <div
                                key={legIndex}
                                className="flight-leg"
                                style={{ marginBottom: '5px' }}
                              >
                                <p>
                                  <strong>Flight Number:</strong>{' '}
                                  {leg?.flightNumber}
                                </p>
                                <p>
                                  <strong>Operating Carrier:</strong>{' '}
                                  {leg?.operatingCarrier?.displayName}
                                </p>
                              </div>
                            ))}
                          </div>
                        ))}
                        <p>
                          <strong>Total Price:</strong>{' '}
                          {flight?.purchaseLinks?.[0]?.totalPrice}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p>No flights available</p>
              )}
  
              {hotels.length > 0 && (
                <div
                  style={{
                    width: '100vw',
                    overflowX: 'scroll',
                    whiteSpace: 'nowrap',
                    scrollBehavior: 'smooth',
                    marginTop: '20px',
                  }}
                >
                  <div
                    className="hotels"
                    style={{
                      display: 'inline-flex',
                      gap: '20px',
                      animation: 'slide 30s linear infinite',
                    }}
                  >
                    {hotels.map((hotel, index) => (
                      <div
                        key={hotel.id}
                        className="hotel-card"
                        style={{
                          minWidth: '300px',
                          display: 'inline-block',
                          border: '1px solid #ddd',
                          padding: '10px',
                          borderRadius: '8px',
                          flexShrink: 0,
                        }}
                      >
                        <h3>{hotel.title}</h3>
                        <p>Rating: {hotel.bubbleRating.rating}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
  
              <div className="nav-buttons">
                <button onClick={prevPage}>Back</button>
                <button onClick={handleSaveItinerary}>Save Itinerary</button>
              </div>
            </>
          )}
        </div>
      </CSSTransition>
      <div className="saved-itineraries">
        <h2>Saved Itineraries</h2>
        {loading ? (
          <PacmanLoader size={30} color="#123abc" />
        ) : savedItineraries.length > 0 ? (
          <ul>
            {savedItineraries.map((itinerary) => (
              <li key={itinerary._id}>
                <button onClick={() => openModal(itinerary)}>
                  Itinerary {savedItineraries.indexOf(itinerary) + 1}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No saved itineraries</p>
        )}
      </div>
    </div>
  );
};
export default Home;  