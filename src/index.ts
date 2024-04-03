import { v4 as uuidv4 } from 'uuid';
import { StableBTreeMap, ic } from 'azle';
import express from 'express';

// Define the FIR (First Information Report) type
type FIR = {
    id: string;
    description: string;
    location: string;
    reportedBy: string;
    createdAt: Date;
    updatedAt: Date | null;
};

// Initialize a StableBTreeMap for FIR storage
const firStorage = StableBTreeMap<string, FIR>(0);

// Create Express app
const app = express();
app.use(express.json());

// Store a new FIR
app.post("/firs", (req, res) => {
    const { description, location, reportedBy } = req.body;
    const firId = uuidv4();
    const createdAt = getCurrentDate();
    const fir: FIR = { id: firId, description, location, reportedBy, createdAt, updatedAt: null };
    firStorage.insert(firId, fir);
    res.send(firId);
});

// Get all FIRs
app.get("/firs", (req, res) => {
    res.send(JSON.stringify(firStorage.values()));
});

// Get a FIR by ID
app.get("/firs/:id", (req, res) => {
    const firId = req.params.id;
    const firOpt = firStorage.get(firId);
    if ("None" in firOpt) {
        res.status(404).send(`The FIR with id=${firId} was not found`);
    } else {
        res.send(JSON.stringify(firOpt.Some));
    }
});

// Update a FIR
app.put("/firs/:id", (req, res) => {
    const firId = req.params.id;
    const firOpt = firStorage.get(firId);
    if ("None" in firOpt) {
        res.status(400).send(`Couldn't update FIR with id=${firId}. FIR not found`);
    } else {
        const fir = firOpt.Some;
        const { description, location, reportedBy } = req.body;
        const updatedAt = getCurrentDate();
        const updatedFIR: FIR = { ...fir, description, location, reportedBy, updatedAt };
        firStorage.insert(firId, updatedFIR);
        res.send(JSON.stringify(updatedFIR));
    }
});

// Delete a FIR by ID
app.delete("/firs/:id", (req, res) => {
    const firId = req.params.id;
    const deletedFIR = firStorage.remove(firId);
    if ("None" in deletedFIR) {
        res.status(400).send(`Couldn't delete FIR with id=${firId}. FIR not found`);
    } else {
        res.send(JSON.stringify(deletedFIR.Some));
    }
});

// Helper function to get the current date
function getCurrentDate(): Date {
    const timestamp = new Number(ic.time());
    return new Date(timestamp.valueOf() / 1000_000);
}

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
