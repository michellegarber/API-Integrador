export function validateEvent(req, res, next) {
    const str = req.body.name;
    if ((str.match(/[A-Za-z]/g) || []).length > 3) {
      next();
    } else {
      res.status(400).json({ message: 'Debe contener por lo menos 3 letras' });
    }
  }