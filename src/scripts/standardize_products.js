const { Client } = require('pg');

async function updateDb() {
  const client = new Client({
    connectionString: 'postgresql://postgres.fqrmvgfbrcgyszgefzlp:innmotekdb2026@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres'
  });
  await client.connect();
  console.log('Connected to Innmotek Supabase PostgreSQL DB');

  // Product 36 (200L)
  const summary36 = '<ul>\n' +
    '  <li>A++ rated high thermodynamic efficiency with COP up to 3.919.</li>\n' +
    '  <li>Eco-friendly R290 natural refrigerant with zero ozone depletion potential.</li>\n' +
    '  <li>Integrated microchannel heat-transfer technology with 75°C max water temp.</li>\n' +
    '  <li>Smart IoT cloud controller with OTA remote diagnostics.</li>\n' +
    '</ul>';

  const spec36 = '<table style="border-collapse:collapse;width: 100%;">\n' +
    '  <tbody>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Model Number</td><td style="width: 50%;">IMWH-200-CHP</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Water Tank Capacity</td><td style="width: 50%;">200 Litres</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Heating Capacity</td><td style="width: 50%;">1,450 W</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Rated Hot-Water Production</td><td style="width: 50%;">31 L/h</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">COP Rating</td><td style="width: 50%;">Up to 3.919</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Refrigerant Type</td><td style="width: 50%;">R290 (Environmentally Friendly)</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Max. Water Temperature</td><td style="width: 50%;">75°C (Heat-pump up to 70°C)</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Auxiliary Electric Heater</td><td style="width: 50%;">2,000 W</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Heat Transfer Technology</td><td style="width: 50%;">Microchannel Heat Exchanger</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Smart Controls</td><td style="width: 50%;">IoT Connectivity + OTA Upgrade Capability</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Tank Construction</td><td style="width: 50%;">Enamel / Duplex Stainless Steel</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Anode Protection</td><td style="width: 50%;">Magnesium Anode Protection</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Acoustic Sound Pressure</td><td style="width: 50%;">~41 dB(A) Quiet Operation</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Electrical Supply</td><td style="width: 50%;">220–240 V, 1pH, 50 Hz</td></tr>\n' +
    '  </tbody>\n' +
    '</table>';

  const desc36 = '<p><strong>INNMOTEK 200L Heat Pump Water Heater &mdash; Smart, Efficient &amp; Reliable Hot Water Solution</strong></p>\n' +
    '<p>The Innmotek 200L Heat Pump Water Heater is engineered to deliver an advanced, energy-efficient domestic hot-water solution for modern residential, hospitality, and light-commercial applications. Combining cutting-edge thermodynamic heat-pump engineering with a 200-litre insulated storage tank, the system provides excellent heating performance while substantially reducing energy consumption compared with conventional electric water heating.</p>\n' +
    '<p>With a maximum water temperature of up to 75°C and heat-pump operation up to 70°C, the unit is engineered to provide reliable hot-water availability for everyday bathing and domestic requirements. Its 1,450 W heating capacity, 31 L/h rated hot-water production, and COP of 3.919 provide an optimal balance between rapid thermal recovery and energy conservation.</p>\n' +
    '<p>The unit incorporates microchannel heat-transfer technology and intelligent low-ambient-temperature air-volume compensation that automatically adjusts operating speed to maintain stable heat exchange even under low-temperature conditions. Powered by environmentally conscious R290 refrigerant, the system operates at an ultra-low acoustic profile of ~41 dB(A) with built-in IoT cloud connectivity and OTA firmware updates.</p>';

  // Product 37 (300L)
  const summary37 = '<ul>\n' +
    '  <li>A++ energy efficiency class with high COP up to 4.029.</li>\n' +
    '  <li>300L high-capacity storage for residential and hospitality hot-water demands.</li>\n' +
    '  <li>Advanced microchannel thermal exchange with low-ambient compensation.</li>\n' +
    '  <li>Smart IoT connectivity with automated OTA system updates.</li>\n' +
    '</ul>';

  const spec37 = '<table style="border-collapse:collapse;width: 100%;">\n' +
    '  <tbody>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Model Number</td><td style="width: 50%;">IMWH-300-CHP</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Water Tank Capacity</td><td style="width: 50%;">300 Litres</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Heating Capacity</td><td style="width: 50%;">1,450 W</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Rated Hot-Water Production</td><td style="width: 50%;">31 L/h</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">COP Rating</td><td style="width: 50%;">Up to 4.029 (A++ Energy Class)</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Refrigerant Type</td><td style="width: 50%;">R290 (Environmentally Friendly)</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Max. Water Temperature</td><td style="width: 50%;">75°C (Heat-pump up to 70°C)</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Auxiliary Electric Heater</td><td style="width: 50%;">2,000 W</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Heat Transfer Technology</td><td style="width: 50%;">Advanced Microchannel Thermal Exchange</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Smart Controls</td><td style="width: 50%;">IoT Connectivity + OTA Upgrade Capability</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Tank Construction</td><td style="width: 50%;">Enamel / Duplex Stainless Steel</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Anode Protection</td><td style="width: 50%;">Magnesium Anode Protection</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Acoustic Sound Pressure</td><td style="width: 50%;">Quiet Architectural Operation</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Electrical Supply</td><td style="width: 50%;">220–240 V, 1pH, 50 Hz</td></tr>\n' +
    '  </tbody>\n' +
    '</table>';

  const desc37 = '<p><strong>INNMOTEK 300L Heat Pump Water Heater &mdash; High-Capacity Hot Water. Higher Efficiency. Smarter Comfort.</strong></p>\n' +
    '<p>The Innmotek 300L Heat Pump Water Heater is a high-capacity solution designed for expansive luxury residences, hospitality facilities, and commercial buildings requiring greater hot-water availability and continuous comfort. With its 300-litre storage capacity, the unit is particularly suited where multiple simultaneous users require hot water throughout the day.</p>\n' +
    '<p>The system delivers 1,450 W heating capacity, 31 L/h rated hot-water production, and achieves an outstanding COP of up to 4.029 under rated conditions with an A++ energy class rating. Advanced microchannel heat-transfer technology and low-ambient compensation automatically adjust airflow to maintain stable heat exchange during demanding cold-weather conditions.</p>\n' +
    '<p>Built with durable Enamel / Duplex Stainless Steel tank construction and sacrificial magnesium anode protection, the system uses natural R290 refrigerant and integrates smart IoT remote control with OTA cloud updates.</p>';

  // Product 38 (150L)
  const summary38 = '<ul>\n' +
    '  <li>High-efficiency thermodynamic heating with 150L enameled storage.</li>\n' +
    '  <li>Low ambient operating range down to -25°C with auto-defrost protection.</li>\n' +
    '  <li>Eco-friendly R134A refrigerant with external condenser safety coil.</li>\n' +
    '  <li>Weekly automatic disinfection cycle with full touch-panel display.</li>\n' +
    '</ul>';

  const spec38 = '<table style="border-collapse:collapse;width: 100%;">\n' +
    '  <tbody>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Model Number</td><td style="width: 50%;">IM-252-150L</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Water Tank Capacity</td><td style="width: 50%;">150 Litres</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Refrigerant Type</td><td style="width: 50%;">R134A (Environmentally Friendly)</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Max. Water Temperature</td><td style="width: 50%;">Up to 75°C</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Ambient Operating Temp</td><td style="width: 50%;">Down to -25°C Sub-Zero</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Condenser Coil</td><td style="width: 50%;">External Condenser Coil (Safety Isolated)</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Inner Tank Material</td><td style="width: 50%;">Enamelled Inner Tank</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Protection Systems</td><td style="width: 50%;">High-Pressure Protection &amp; Auto Defrosting</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Hygiene Function</td><td style="width: 50%;">Weekly Auto Sterilization / Disinfection</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Operation Mode</td><td style="width: 50%;">Full Automatic Operation</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Auxiliary Electric Heater</td><td style="width: 50%;">Auxiliary Electric Heater Included</td></tr>\n' +
    '    <tr><td style="width: 50%; font-weight: 600;">Display &amp; Controls</td><td style="width: 50%;">Modern Square Design with Large Touch-Button Screen</td></tr>\n' +
    '  </tbody>\n' +
    '</table>';

  const desc38 = '<p><strong>All-in-One Hot Water Heat Pump &mdash; 150L (IM-252-150L)</strong></p>\n' +
    '<p>Heat pump water heaters utilize advanced refrigeration thermodynamics to move heat from ambient air to water instead of generating heat directly through electric resistance elements. This thermodynamic efficiency enables energy savings of up to 70% compared to conventional storage geysers.</p>\n' +
    '<p>The IM-252-150L unit provides quiet, consistent domestic hot water even in low ambient temperatures down to -25°C. Built with safety-isolated external condenser coils and enamelled tank technology, it delivers hygienic, long-lasting performance for modern residential installations.</p>';

  console.log('Updating Product 36...');
  await client.query('UPDATE products SET summary = $1, specification = $2, description = $3 WHERE id = 36', [summary36, spec36, desc36]);

  console.log('Updating Product 37...');
  await client.query('UPDATE products SET summary = $1, specification = $2, description = $3 WHERE id = 37', [summary37, spec37, desc37]);

  console.log('Updating Product 38...');
  await client.query('UPDATE products SET summary = $1, specification = $2, description = $3 WHERE id = 38', [summary38, spec38, desc38]);

  await client.end();
  console.log('SUCCESS: All 3 products updated and standardized in Innmotek PostgreSQL database!');
}

updateDb().catch(err => {
  console.error('Update failed:', err);
  process.exit(1);
});
