import { body, validationResult } from 'express-validator';

// Validaciones para registro de usuario
export const registerValidation = [
    body('nombre')
        .trim()
        .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres')
        .matches(/^[a-zA-Z\s]+$/).withMessage('El nombre solo puede contener letras'),
    
    body('email')
        .trim()
        .isEmail().withMessage('Correo electrónico inválido')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/\d/).withMessage('La contraseña debe contener al menos un número')
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una letra mayúscula')
        .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una letra minúscula')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('La contraseña debe contener al menos un carácter especial'),
    
    body('rol')
        .optional()
        .isIn(['admin', 'editor']).withMessage('Rol inválido')
];

// Validaciones para inicio de sesión
export const loginValidation = [
    body('email')
        .trim()
        .isEmail().withMessage('Correo electrónico inválido')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('La contraseña es obligatoria')
];

// Validaciones para crear noticia
export const newsValidation = [
    body('titulo')
        .trim()
        .isLength({ min: 5, max: 255 }).withMessage('El título debe tener entre 5 y 255 caracteres'),
    
    body('contenido')
        .trim()
        .isLength({ min: 10 }).withMessage('El contenido debe tener al menos 10 caracteres'),
    
    body('imagen')
        .optional()
        .isURL().withMessage('La imagen debe ser una URL válida')
];

// Middleware de validación general
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Error de validación',
            errors: errors.array()
        });
    }
    
    next();
};