/**
 * FAQ Admin Controller
 * 
 * Replaces Laravel Controller:
 *   App\Http\Controllers\Backend\FaqController (index, create, store, edit, update, destroy)
 * 
 * Behavior Differences:
 *   - Manages question and rich answer text
 *   - Clean RESTful JSON response format
 */

const db = require('../../config/database');
const { sendSuccess, sendError } = require('../../helpers/response.helper');

class FaqAdminController {
  index(req, res) {
    try {
      const faqs = db.table('faqs').all();
      return sendSuccess(res, 'faqs', faqs);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  show(req, res) {
    try {
      const faq = db.table('faqs').find(req.params.id);
      if (!faq) return sendError(res, 'FAQ not found', 404);
      return sendSuccess(res, 'faq', faq);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  store(req, res) {
    try {
      const { question, answer, status } = req.body;
      if (!question) return sendError(res, 'Question is required', 422);

      const newFaq = db.table('faqs').insert({
        question,
        answer: answer || '',
        status: status !== undefined ? Number(status) : 1
      });

      return sendSuccess(res, 'faq', newFaq, 201);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  update(req, res) {
    try {
      const id = req.params.id;
      const existing = db.table('faqs').find(id);
      if (!existing) return sendError(res, 'FAQ not found', 404);

      const { question, answer, status } = req.body;

      const updated = db.table('faqs').update(id, {
        question: question !== undefined ? question : existing.question,
        answer: answer !== undefined ? answer : existing.answer,
        status: status !== undefined ? Number(status) : existing.status
      });

      return sendSuccess(res, 'faq', updated);
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }

  destroy(req, res) {
    try {
      const id = req.params.id;
      const existing = db.table('faqs').find(id);
      if (!existing) return sendError(res, 'FAQ not found', 404);

      db.table('faqs').delete(id);
      return sendSuccess(res, 'message', 'FAQ deleted successfully');
    } catch (err) {
      return sendError(res, err.message, 500);
    }
  }
}

module.exports = new FaqAdminController();
