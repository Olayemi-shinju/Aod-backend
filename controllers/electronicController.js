import Electronic from "../models/electronicsModel.js";

export const createElectronic = async (req, res) => {
    try {
        const { name, Wattage } = req.body;

        if (!name || !Wattage) {
            return res.status(400).json({ success: false, msg: 'Please fill all fields' });
        }

        const data = new Electronic({ name, Wattage });
        const resp = await data.save();

        res.status(201).json({ success: true, msg: 'Electronic created successfully', data: resp });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, msg: 'An error occurred' });
    }
};

export const updateElectronic = async (req, res) => {
    try {
        const { name, Wattage } = req.body;
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, msg: 'Electronic ID is required' });
        }

        const existedElectronic = await Electronic.findById(id);

        if (!existedElectronic) {
            return res.status(404).json({ success: false, msg: 'Electronic not found' });
        }

        if (!name || !Wattage) {
            return res.status(400).json({ success: false, msg: 'Please fill all fields' });
        }

        const updated = await Electronic.findByIdAndUpdate(id, { name, Wattage }, { new: true });

        res.status(200).json({ success: true, msg: 'Electronic updated successfully', data: updated });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, msg: 'An error occurred' });
    }
};

export const deleteElectronic = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, msg: 'Electronic ID is required' });
        }

        const existedElectronic = await Electronic.findById(id);

        if (!existedElectronic) {
            return res.status(404).json({ success: false, msg: 'Electronic not found' });
        }

        await Electronic.findByIdAndDelete(id);

        const allElectronics = await Electronic.find();

        res.status(200).json({ success: true, msg: 'Electronic deleted successfully', data: allElectronics });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, msg: 'An error occurred' });
    }
};

export const getAllElectronic = async (req, res) => {
    try {
        const resp = await Electronic.find();

        if (!resp || resp.length === 0) {
            return res.status(404).json({ success: false, msg: 'No electronics found' });
        }

        res.status(200).json({ success: true, msg: 'Electronics retrieved successfully', data: resp });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, msg: 'An error occurred' });
    }
};

// Mapping of location to sunlight hours
const stateSunlightMap = {
  "Abia": 4.2,
  "Adamawa": 5.4,
  "Akwa Ibom": 4.2,
  "Anambra": 4.3,
  "Bauchi": 5.4,
  "Bayelsa": 4.0,
  "Benue": 4.8,
  "Borno": 5.5,
  "Cross River": 4.1,
  "Delta": 4.2,
  "Ebonyi": 4.3,
  "Edo": 4.4,
  "Ekiti": 4.4,
  "Enugu": 4.2,
  "FCT - Abuja": 5.0,
  "Gombe": 5.3,
  "Imo": 4.2,
  "Jigawa": 5.4,
  "Kaduna": 5.0,
  "Kano": 5.5,
  "Katsina": 5.5,
  "Kebbi": 5.4,
  "Kogi": 4.6,
  "Kwara": 4.8,
  "Lagos": 4.0,
  "Nasarawa": 4.8,
  "Niger": 4.9,
  "Ogun": 4.2,
  "Ondo": 4.3,
  "Osun": 4.4,
  "Oyo": 4.4,
  "Plateau": 5.0,
  "Rivers": 4.0,
  "Sokoto": 5.5,
  "Taraba": 5.2,
  "Yobe": 5.3,
  "Zamfara": 5.5
};


export const calculateEnergy = async (req, res) => {
    try {
        const { appliances, duration, batteryType, systemType, location } = req.body;

        if (!appliances || appliances.length === 0 || !duration || !batteryType) {
            return res.status(400).json({ success: false, msg: 'Missing required fields' });
        }

        const totalWattage = appliances.reduce((total, item) => {
            const wattage = parseFloat(item.wattage);
            const units = parseInt(item.units);
            return total + (isNaN(wattage) || isNaN(units) ? 0 : wattage * units);
        }, 0);

        const energyRequiredWh = totalWattage * parseFloat(duration); // Watt-hours

        // Default battery config
        let batteryVoltage = 12;
        let batteryAh = 150;
        let DoD = 0.6;
        let efficiency = 0.85;
        let batteryLabel = 'Other';

        if (batteryType === 'lithium') {
            batteryAh = 100;
            DoD = 0.9;
            efficiency = 0.95;
            batteryLabel = 'Lithium';
        } else if (batteryType === 'tubular') {
            batteryAh = 200;
            DoD = 0.5;
            efficiency = 0.8;
            batteryLabel = 'Tubular';
        }

        const usableBatteryWh = batteryVoltage * batteryAh * DoD;
        const adjustedEnergyRequiredWh = energyRequiredWh / efficiency;
        const numberOfBatteries = Math.ceil(adjustedEnergyRequiredWh / usableBatteryWh);

        // Inverter capacity
        const inverterCapacityKVA = (totalWattage / 0.8 / 1000).toFixed(2); // Assume PF = 0.8

        // If solar system is selected
        let solarPanels = null;
        if (systemType === 'inverter_solar') {
            const sunlightHours = stateSunlightMap[location] || 4.5;
            const panelWatt = 400; // 400W panel assumed
            const dailySolarWhPerPanel = panelWatt * sunlightHours;

            const numberOfPanels = Math.ceil(adjustedEnergyRequiredWh / dailySolarWhPerPanel);

            solarPanels = {
                location,
                sunlightHours,
                panelWatt,
                numberOfPanels,
            };
        }

        return res.status(200).json({
            success: true,
            msg: 'Energy calculation complete',
            result: {
                totalWattage,
                duration,
                totalEnergyRequiredWh: energyRequiredWh,
                adjustedEnergyRequiredWh,
                inverterCapacityKVA,
                batteryType: batteryLabel,
                usableBatteryWh,
                numberOfBatteries,
                ...(solarPanels && { solar: solarPanels }),
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: 'Internal Server Error' });
    }
};
