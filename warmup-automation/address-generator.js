/**
 * Address Generator - Realistic addresses for NL, DE, UK, US
 * Generates random, realistic addresses for Gmail account profiles
 */

const fs = require('fs');
const path = require('path');

// Address data sources
const ADDRESS_DATA = {
    NL: {
        country: 'Netherlands',
        code: 'NL',
        cities: [
            { name: 'Amsterdam', population: 872000, coords: { lat: 52.3676, lng: 4.9041 } },
            { name: 'Rotterdam', population: 655000, coords: { lat: 51.9225, lng: 4.47917 } },
            { name: 'The Hague', population: 544000, coords: { lat: 52.07866, lng: 4.28878 } },
            { name: 'Utrecht', population: 357000, coords: { lat: 52.0907, lng: 5.12142 } },
            { name: 'Eindhoven', population: 234000, coords: { lat: 51.4416, lng: 5.46972 } },
            { name: 'Groningen', population: 234000, coords: { lat: 53.2194, lng: 6.5665 } },
            { name: 'Tilburg', population: 222000, coords: { lat: 51.5551, lng: 5.08833 } },
            { name: 'Almere', population: 218000, coords: { lat: 52.35078, lng: 5.2647 } },
            { name: 'Breda', population: 184000, coords: { lat: 51.58925, lng: 4.77639 } },
            { name: 'Nijmegen', population: 179000, coords: { lat: 51.8425, lng: 5.85278 } }
        ],
        streetNames: [
            'Straat', 'Laan', 'Weg', 'Kade', 'Gracht', 'Singel', 'Park', 'Plantsoen',
            'Dijk', 'Pad', 'Steeg', 'Hof', 'Plein', 'Boulevard', 'Laan', 'Markt',
            'Kerkweg', 'Schoolstraat', 'Kerkstraat', 'Hoofdstraat', 'Dorpsstraat', 
            'Molenstraat', 'Kerkpad', 'Kerklaan', 'Parkweg', 'Parklaan'
        ],
        streetPrefixes: [
            'Amsterdamse', 'Rotterdamse', 'Haagse', 'Utrechtse', 'Koningin', 'Prins',
            'Juliana', 'Wilhelmina', 'Beatrix', 'Willem-Alexander', 'Maurits', 'Frederik',
            'Constantijn', 'Christiaan', 'Nassauplein', 'Maliebaan', 'Neude', 'Vredenburg'
        ],
        postalCodes: {
            Amsterdam: ['1011-1018', '1020-1029', '1030-1039', '1050-1059', '1060-1069', '1070-1079', '1080-1089', '1090-1099'],
            Rotterdam: ['3011-3015', '3020-3029', '3030-3039', '3040-3049', '3050-3059', '3060-3069', '3070-3079', '3080-3089'],
            TheHague: ['2511-2517', '2520-2529', '2530-2539', '2540-2549', '2550-2559', '2560-2569', '2570-2579', '2580-2589'],
            Utrecht: ['3511-3515', '3520-3529', '3530-3539', '3540-3549', '3550-3559', '3560-3569', '3570-3579', '3580-3589']
        },
        phoneFormats: ['06-XXXXXXXX', '06-XXXXXXXX', '020-XXXXXXXX', '010-XXXXXXXX', '030-XXXXXXXX']
    },
    
    DE: {
        country: 'Germany',
        code: 'DE',
        cities: [
            { name: 'Berlin', population: 3645000, coords: { lat: 52.52, lng: 13.405 } },
            { name: 'Hamburg', population: 1841000, coords: { lat: 53.5511, lng: 9.99368 } },
            { name: 'Munich', population: 1472000, coords: { lat: 48.1351, lng: 11.582 } },
            { name: 'Cologne', population: 1086000, coords: { lat: 50.9375, lng: 6.96028 } },
            { name: 'Frankfurt', population: 753000, coords: { lat: 50.1107, lng: 8.68243 } },
            { name: 'Stuttgart', population: 634000, coords: { lat: 48.7754, lng: 9.18276 } },
            { name: 'Düsseldorf', population: 619000, coords: { lat: 51.2277, lng: 6.77345 } },
            { name: 'Leipzig', population: 587000, coords: { lat: 51.3397, lng: 12.3731 } },
            { name: 'Dresden', population: 554000, coords: { lat: 51.0504, lng: 13.7373 } },
            { name: 'Hannover', population: 534000, coords: { lat: 52.3759, lng: 9.73201 } }
        ],
        streetNames: [
            'Straße', 'Allee', 'Platz', 'Weg', 'Gasse', 'Damm', 'Chaussee', 'Promenade',
            'Ring', 'Graben', 'Mauer', 'Wall', 'Park', 'Garten', 'Hof', 'Schloss',
            'Kirchstraße', 'Hauptstraße', 'Bahnhofstraße', 'Markt', 'Rathausplatz'
        ],
        streetPrefixes: [
            'Berliner', 'Hamburger', 'Münchner', 'Kölner', 'Frankfurter', 'Stuttgarter',
            'Düsseldorfer', 'Leipziger', 'Dresdner', 'Hannoveraner', 'König', 'Kaiser',
            'Friedrich', 'Bismarck', 'Goethe', 'Schiller', 'Mozart', 'Bach', 'Beethoven'
        ],
        postalCodes: {
            Berlin: ['10115-10369', '10365-10369', '10551-10589', '10707-10789', '12047-12557'],
            Hamburg: ['20095-20539', '21029-21149', '22041-22547'],
            Munich: ['80331-80339', '80469-81929', '85540-85579'],
            Cologne: ['50667-50679', '50670-51069', '51103-51379']
        },
        phoneFormats: ['015X-XXXXXXX', '0160-XXXXXXX', '0170-XXXXXXX', '0151-XXXXXXX', '030-XXXXXXX', '040-XXXXXXX']
    },
    
    UK: {
        country: 'United Kingdom',
        code: 'GB',
        cities: [
            { name: 'London', population: 8982000, coords: { lat: 51.5074, lng: -0.1278 } },
            { name: 'Birmingham', population: 1141000, coords: { lat: 52.4862, lng: -1.8904 } },
            { name: 'Manchester', population: 547000, coords: { lat: 53.4808, lng: -2.2426 } },
            { name: 'Leeds', population: 489000, coords: { lat: 53.8008, lng: -1.5491 } },
            { name: 'Glasgow', population: 609000, coords: { lat: 55.8642, lng: -4.2518 } },
            { name: 'Edinburgh', population: 482000, coords: { lat: 55.9533, lng: -3.1883 } },
            { name: 'Liverpool', population: 498000, coords: { lat: 53.4084, lng: -2.9916 } },
            { name: 'Bristol', population: 467000, coords: { lat: 51.4545, lng: -2.5879 } },
            { name: 'Sheffield', population: 584000, coords: { lat: 53.3811, lng: -1.4701 } },
            { name: 'Newcastle', population: 296000, coords: { lat: 54.9783, lng: -1.6178 } }
        ],
        streetNames: [
            'Street', 'Road', 'Lane', 'Avenue', 'Gardens', 'Close', 'Court', 'Place',
            'Square', 'Crescent', 'Grove', 'Hill', 'Park', 'Way', 'Drive', 'Circus',
            'High Street', 'Church Street', 'Market Street', 'King Street', 'Queen Street'
        ],
        streetPrefixes: [
            'Kings', 'Queens', 'Princes', 'Victoria', 'Albert', 'George', 'William',
            'Oxford', 'Cambridge', 'Regent', 'Piccadilly', 'Baker', 'Bond', 'Fleet',
            'Cheapside', 'Strand', 'Whitehall', 'Downing', 'Abbey', 'Cathedral'
        ],
        postalCodes: {
            London: ['EC1A', 'EC2A', 'EC3A', 'EC4A', 'SW1A', 'W1A', 'E1', 'N1', 'SE1', 'NW1'],
            Birmingham: ['B1', 'B2', 'B3', 'B4', 'B5'],
            Manchester: ['M1', 'M2', 'M3', 'M4'],
            Leeds: ['LS1', 'LS2', 'LS3', 'LS4']
        },
        phoneFormats: ['07XXX XXXXXX', '07XXX XXXXXX', '020 XXXX XXXX', '0161 XXX XXXX', '0121 XXX XXXX']
    },
    
    US: {
        country: 'United States',
        code: 'US',
        cities: [
            { name: 'New York', state: 'NY', population: 8336000, coords: { lat: 40.7128, lng: -74.006 } },
            { name: 'Los Angeles', state: 'CA', population: 3976000, coords: { lat: 34.0522, lng: -118.243 } },
            { name: 'Chicago', state: 'IL', population: 2694000, coords: { lat: 41.8781, lng: -87.6298 } },
            { name: 'Houston', state: 'TX', population: 2320000, coords: { lat: 29.7604, lng: -95.3698 } },
            { name: 'Phoenix', state: 'AZ', population: 1680000, coords: { lat: 33.4484, lng: -112.074 } },
            { name: 'Philadelphia', state: 'PA', population: 1584000, coords: { lat: 39.9526, lng: -75.1652 } },
            { name: 'San Antonio', state: 'TX', population: 1547000, coords: { lat: 29.4241, lng: -98.4936 } },
            { name: 'San Diego', state: 'CA', population: 1423000, coords: { lat: 32.7157, lng: -117.161 } },
            { name: 'Dallas', state: 'TX', population: 1343000, coords: { lat: 32.7767, lng: -96.797 } },
            { name: 'San Jose', state: 'CA', population: 1021000, coords: { lat: 37.3382, lng: -121.886 } }
        ],
        streetNames: [
            'Street', 'Avenue', 'Boulevard', 'Road', 'Lane', 'Drive', 'Way', 'Court',
            'Place', 'Square', 'Circle', 'Terrace', 'Run', 'Trail', 'Park', 'Highway',
            'Main Street', 'Oak Street', 'Maple Avenue', 'Cedar Lane', 'Washington Street'
        ],
        streetPrefixes: [
            'Washington', 'Jefferson', 'Lincoln', 'Roosevelt', 'Kennedy', 'Reagan',
            'Broadway', 'Sunset', 'Hollywood', 'Fifth Avenue', 'Park Avenue', 'Wall Street',
            'Market Street', 'Michigan Avenue', 'Pennsylvania Avenue', 'Constitution Avenue'
        ],
        postalCodes: {
            'New York': ['10001-10282'],
            'Los Angeles': ['90001-90089'],
            'Chicago': ['60601-60661'],
            'Houston': ['77001-77099']
        },
        phoneFormats: ['(XXX) XXX-XXXX', '(XXX) XXX-XXXX', '(XXX) XXX-XXXX', '(XXX) XXX-XXXX']
    }
};

// First names (mixed international)
const FIRST_NAMES = [
    'Emma', 'Liam', 'Olivia', 'Noah', 'Sophia', 'Mason', 'Isabella', 'William', 'Mia', 'Jacob',
    'Charlotte', 'Michael', 'Amelia', 'James', 'Harper', 'Benjamin', 'Evelyn', 'Lucas', 'Abigail', 'Henry',
    'Emily', 'Alexander', 'Elizabeth', 'Daniel', 'Sofia', 'Matthew', 'Avery', 'David', 'Ella', 'Joseph',
    'Grace', 'Samuel', 'Chloe', 'Sebastian', 'Victoria', 'Aiden', 'Penelope', 'John', 'Scarlett', 'Ryan',
    'Luna', 'Nathan', 'Zoey', 'Caleb', 'Nora', 'Dylan', 'Layla', 'Luke', 'Mila', 'Christian',
    'Jan', 'Emma', 'Lucas', 'Sophie', 'Daan', 'Julia', 'Sem', 'Tess', 'Levi', 'Fleur',
    'Hans', 'Grete', 'Kurt', 'Lotte', 'Fritz', 'Martha', 'Otto', 'Emma', 'Heinrich', 'Maria'
];

// Last names by country
const LAST_NAMES = {
    NL: ['Jansen', 'de Jong', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer', 'de Vries', 'van den Berg', 'van Dijk'],
    DE: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann'],
    UK: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor'],
    US: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson']
};

// Helper functions
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Generate Dutch address
 */
function generateDutchAddress() {
    const data = ADDRESS_DATA.NL;
    const city = randomItem(data.cities);
    const streetName = randomItem(data.streetNames);
    const streetPrefix = Math.random() > 0.5 ? randomItem(data.streetPrefixes) + ' ' : '';
    const houseNumber = randomInt(1, 999);
    const postalCode = generateDutchPostalCode(city.name);
    
    return {
        country: data.country,
        countryCode: data.code,
        street: `${streetPrefix}${streetName}`,
        houseNumber: `${houseNumber}${Math.random() > 0.7 ? ['a', 'b', 'c'][randomInt(0, 2)] : ''}`,
        postalCode: postalCode,
        city: city.name,
        state: '',
        fullAddress: `${streetPrefix}${streetName} ${houseNumber}, ${postalCode} ${city.name}, ${data.country}`,
        phone: generatePhoneNumber(data.phoneFormats),
        coords: city.coords
    };
}

/**
 * Generate German address
 */
function generateGermanAddress() {
    const data = ADDRESS_DATA.DE;
    const city = randomItem(data.cities);
    const streetName = randomItem(data.streetNames);
    const streetPrefix = Math.random() > 0.5 ? randomItem(data.streetPrefixes) + ' ' : '';
    const houseNumber = randomInt(1, 999);
    const postalCode = generateGermanPostalCode(city.name);
    
    return {
        country: data.country,
        countryCode: data.code,
        street: `${streetPrefix}${streetName}`,
        houseNumber: `${houseNumber}`,
        postalCode: postalCode,
        city: city.name,
        state: '',
        fullAddress: `${streetPrefix}${streetName} ${houseNumber}, ${postalCode} ${city.name}, ${data.country}`,
        phone: generatePhoneNumber(data.phoneFormats),
        coords: city.coords
    };
}

/**
 * Generate UK address
 */
function generateUKAddress() {
    const data = ADDRESS_DATA.UK;
    const city = randomItem(data.cities);
    const streetName = randomItem(data.streetNames);
    const streetPrefix = Math.random() > 0.5 ? randomItem(data.streetPrefixes) + ' ' : '';
    const houseNumber = randomInt(1, 500);
    const postalCode = generateUKPostalCode(city.name);
    
    return {
        country: data.country,
        countryCode: data.code,
        street: `${streetPrefix}${streetName}`,
        houseNumber: `${houseNumber}`,
        postalCode: postalCode,
        city: city.name,
        state: '',
        fullAddress: `${houseNumber} ${streetPrefix}${streetName}, ${city.name}, ${postalCode}, ${data.country}`,
        phone: generatePhoneNumber(data.phoneFormats),
        coords: city.coords
    };
}

/**
 * Generate US address
 */
function generateUSAddress() {
    const data = ADDRESS_DATA.US;
    const city = randomItem(data.cities);
    const streetName = randomItem(data.streetNames);
    const streetPrefix = Math.random() > 0.5 ? randomItem(data.streetPrefixes) + ' ' : '';
    const houseNumber = randomInt(1, 9999);
    const postalCode = generateUSPostalCode(city.name);
    
    return {
        country: data.country,
        countryCode: data.code,
        street: `${streetPrefix}${streetName}`,
        houseNumber: `${houseNumber}`,
        postalCode: postalCode,
        city: city.name,
        state: city.state,
        fullAddress: `${houseNumber} ${streetPrefix}${streetName}, ${city.name}, ${city.state} ${postalCode}, ${data.country}`,
        phone: generatePhoneNumber(data.phoneFormats),
        coords: city.coords
    };
}

/**
 * Generate Dutch postal code
 */
function generateDutchPostalCode(cityName) {
    const cityCodes = ADDRESS_DATA.NL.postalCodes;
    let codeRange = ['1000-9999'];
    
    if (cityName === 'Amsterdam') codeRange = cityCodes.Amsterdam;
    else if (cityName === 'Rotterdam') codeRange = cityCodes.Rotterdam;
    else if (cityName === 'TheHague') codeRange = cityCodes.TheHague;
    else if (cityName === 'Utrecht') codeRange = cityCodes.Utrecht;
    
    const range = randomItem(codeRange);
    const [start, end] = range.split('-').map(n => parseInt(n.replace(/\D/g, '')));
    const code = randomInt(start, end);
    
    return `${Math.floor(code / 1000)}${String(code % 1000).padStart(2, '0')} ${String(randomInt(1, 9)).toUpperCase()}${String(randomInt(65, 90))}`;
}

/**
 * Generate German postal code
 */
function generateGermanPostalCode(cityName) {
    const cityCodes = ADDRESS_DATA.DE.postalCodes;
    let codeRange = ['10115-99999'];
    
    if (cityName === 'Berlin') codeRange = cityCodes.Berlin;
    else if (cityName === 'Hamburg') codeRange = cityCodes.Hamburg;
    else if (cityName === 'Munich') codeRange = cityCodes.Munich;
    else if (cityName === 'Cologne') codeRange = cityCodes.Cologne;
    
    const range = randomItem(codeRange);
    const parts = range.split('-');
    const start = parseInt(parts[0]);
    const end = parseInt(parts[1]);
    
    return String(randomInt(start, end));
}

/**
 * Generate UK postal code
 */
function generateUKPostalCode(cityName) {
    const cityCodes = ADDRESS_DATA.UK.postalCodes;
    let prefix = 'SW1A';
    
    if (cityName === 'London') prefix = randomItem(cityCodes.London);
    else if (cityName === 'Birmingham') prefix = randomItem(cityCodes.Birmingham);
    else if (cityName === 'Manchester') prefix = randomItem(cityCodes.Manchester);
    else if (cityName === 'Leeds') prefix = randomItem(cityCodes.Leeds);
    
    const outwardCode = prefix;
    const inwardCode = `${randomInt(1, 9)}${String(randomInt(65, 90))}${String(randomInt(65, 90))}`;
    
    return `${outwardCode} ${inwardCode}`;
}

/**
 * Generate US postal code
 */
function generateUSPostalCode(cityName) {
    const cityCodes = ADDRESS_DATA.US.postalCodes;
    let range = ['10001-99999'];
    
    if (cityName === 'New York') range = cityCodes['New York'];
    else if (cityName === 'Los Angeles') range = cityCodes['Los Angeles'];
    else if (cityName === 'Chicago') range = cityCodes['Chicago'];
    else if (cityName === 'Houston') range = cityCodes['Houston'];
    
    const [start, end] = randomItem(range).split('-');
    return String(randomInt(parseInt(start), parseInt(end)));
}

/**
 * Generate phone number
 */
function generatePhoneNumber(formats) {
    const format = randomItem(formats);
    return format.replace(/X/g, () => String(randomInt(0, 9)));
}

/**
 * Generate full person profile
 */
function generatePerson(country) {
    let address;
    let lastName;
    
    switch (country.toUpperCase()) {
        case 'NL':
        case 'NLD':
        case 'NETHERLANDS':
            address = generateDutchAddress();
            lastName = randomItem(LAST_NAMES.NL);
            break;
        case 'DE':
        case 'DEU':
        case 'GERMANY':
            address = generateGermanAddress();
            lastName = randomItem(LAST_NAMES.DE);
            break;
        case 'UK':
        case 'GBR':
        case 'UNITED KINGDOM':
            address = generateUKAddress();
            lastName = randomItem(LAST_NAMES.UK);
            break;
        case 'US':
        case 'USA':
        case 'UNITED STATES':
            address = generateUSAddress();
            lastName = randomItem(LAST_NAMES.US);
            break;
        default:
            address = generateDutchAddress();
            lastName = randomItem(LAST_NAMES.NL);
    }
    
    const firstName = randomItem(FIRST_NAMES);
    const birthYear = randomInt(1970, 2000);
    const birthMonth = String(randomInt(1, 12)).padStart(2, '0');
    const birthDay = String(randomInt(1, 28)).padStart(2, '0');
    
    return {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        birthDate: `${birthYear}-${birthMonth}-${birthDay}`,
        email: null, // Will be assigned
        address: address,
        phone: address.phone,
        age: 2024 - birthYear,
        nationality: address.country
    };
}

/**
 * Generate profile for Gmail account
 */
function generateGmailProfile(country, email) {
    const person = generatePerson(country);
    person.email = email;
    return person;
}

/**
 * Generate multiple profiles
 */
function generateMultipleProfiles(count, countries = ['NL', 'DE', 'UK', 'US']) {
    const profiles = [];
    
    for (let i = 0; i < count; i++) {
        const country = randomItem(countries);
        profiles.push({
            ...generatePerson(country),
            profileId: null, // Will be assigned
            generatedAt: new Date().toISOString()
        });
    }
    
    return profiles;
}

/**
 * Save profiles to file
 */
function saveProfiles(profiles, filename = './users/generated-profiles.json') {
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filename, JSON.stringify(profiles, null, 2));
    console.log(`✅ Saved ${profiles.length} profiles to ${filename}`);
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const count = parseInt(args[0]) || 1;
    const country = args[1] || 'NL';
    
    if (args[0] === 'all') {
        console.log('\n🌍 Generating sample addresses for all countries...\n');
        
        const countries = ['NL', 'DE', 'UK', 'US'];
        countries.forEach(c => {
            const profile = generatePerson(c);
            console.log(`${c}: ${profile.fullName}`);
            console.log(`   ${profile.address.fullAddress}`);
            console.log(`   Phone: ${profile.phone}`);
            console.log(`   Born: ${profile.birthDate}\n`);
        });
    } else {
        console.log(`\n📧 Generating ${count} profile(s) for ${country}...\n`);
        
        const profiles = generateMultipleProfiles(count, [country]);
        profiles.forEach((profile, i) => {
            console.log(`${i + 1}. ${profile.fullName}`);
            console.log(`   📍 ${profile.address.fullAddress}`);
            console.log(`   📱 ${profile.phone}`);
            console.log(`   🎂 ${profile.birthDate}\n`);
        });
        
        if (args[2] === '--save') {
            saveProfiles(profiles);
        }
    }
}

module.exports = {
    generatePerson,
    generateGmailProfile,
    generateMultipleProfiles,
    generateDutchAddress,
    generateGermanAddress,
    generateUKAddress,
    generateUSAddress,
    saveProfiles
};
