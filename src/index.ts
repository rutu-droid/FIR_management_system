
import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';

// Define the FIR (First Information Report) type
interface FIR {
    id: string;
    description: string;
    location: string;
    reportedBy: string;
    createdAt: Date;
    updatedAt: Date | null;
}

// Initialize a StableBTreeMap for FIR storage
const firStorage = StableBTreeMap<string, FIR>(0);

// Create the Canister Smart Contract
export default Server(() => {
    const app = express();
    app.use(express.json());

    // Endpoint to create a new FIR
    app.post("/firs", (req, res) => {
        const fir: FIR = {
            id: uuidv4(),
            createdAt: getCurrentDate(),
            ...req.body
        };
        firStorage.insert(fir.id, fir);
        res.json(fir);
    });

    // Endpoint to retrieve all FIRs
    app.get("/firs", (req, res) => {
        res.json(firStorage.values());
    });

    // Endpoint to retrieve a specific FIR by ID
    app.get("/firs/:id", (req, res) => {
        const firId = req.params.id;
        const firOpt = firStorage.get(firId);
        if ("None" in firOpt) {
            res.status(404).send(`The FIR with id=${firId} was not found`);
        } else {
            res.json(firOpt.Some);
        }
    });

    // Endpoint to update a specific FIR by ID
    app.put("/firs/:id", (req, res) => {
        const firId = req.params.id;
        const firOpt = firStorage.get(firId);
        if ("None" in firOpt) {
            res.status(400).send(`Couldn't update FIR with id=${firId}. FIR not found`);
        } else {
            const fir = firOpt.Some;
            const updatedFIR = { ...fir, ...req.body, updatedAt: getCurrentDate() };
            firStorage.insert(fir.id, updatedFIR);
            res.json(updatedFIR);
        }
    });

    // Endpoint to delete a specific FIR by ID
    app.delete("/firs/:id", (req, res) => {
        const firId = req.params.id;
        const deletedFIR = firStorage.remove(firId);
        if ("None" in deletedFIR) {
            res.status(400).send(`Couldn't delete FIR with id=${firId}. FIR not found`);
        } else {
            res.json(deletedFIR.Some);
        }
    });

    // Start the Express server
    return app.listen();
});

// Helper function to get the current date
function getCurrentDate() {
    const timestamp = new Number(ic.time());
    return new Date(timestamp.valueOf() / 1000_000);
}
