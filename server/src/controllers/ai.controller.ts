import { Request, Response } from 'express';
import { aiService } from '../services/ai.service.js';

export class AIController {
  public async previewSymptoms(req: Request, res: Response): Promise<void> {
    try {
      const { symptoms } = req.body;

      if (!symptoms || !symptoms.trim()) {
        res.status(400).json({ success: false, message: 'Symptoms description is required.' });
        return;
      }

      const analysis = await aiService.analyzePreVisitSymptoms(symptoms.trim());
      res.json({ success: true, analysis });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async previewNotes(req: Request, res: Response): Promise<void> {
    try {
      const { notes } = req.body;

      if (!notes || !notes.trim()) {
        res.status(400).json({ success: false, message: 'Clinical notes are required.' });
        return;
      }

      const carePlan = await aiService.generatePostVisitSummary(notes.trim());
      res.json({ success: true, carePlan });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const aiController = new AIController();
