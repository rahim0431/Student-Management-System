<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Middleware\EnsureAdmin;

use App\Http\Controllers\RequestDemoController; // for demo request form

// Route::post('/register', [AuthController::class, 'register']);
// Route::post('/login', [AuthController::class, 'login']);

Route::post('/request-demo',[RequestDemoController::class, 'store']); // to store request demo
Route::get('/admin/request-demo',[AdminController::class, 'getRequestDemo']); // to nofity request demo to admin    

// Protected Routes (assuming you use Sanctum auth middleware)
Route::middleware(['auth:sanctum'])->group(function () {
    
    Route::middleware(EnsureAdmin::class)->prefix('admin')->group(function () {

        // Dashboard
        Route::get('/dashboard', [AdminController::class, 'dashboard']);

        // STUDENTS
        Route::post('/add-student', [AdminController::class, 'addStudent']);
        Route::put('/student/{id}', [AdminController::class, 'updateStudent']);
        Route::get('/students', [AdminController::class, 'viewStudents']);
        Route::delete('/student/{id}', [AdminController::class, 'deleteStudent']);

        // TEACHERS
        Route::post('/add-teacher', [AdminController::class, 'addTeacher']);
        Route::put('/teacher/{id}', [AdminController::class, 'updateTeacher']);
        Route::get('/teachers', [AdminController::class, 'viewTeachers']);
        Route::delete('/teacher/{id}', [AdminController::class, 'deleteTeacher']);

        // DEMO REQUESTS
        Route::get('/demo-requests', [RequestDemoController::class, 'index']);
        Route::delete('/demo-requests/{id}', [RequestDemoController::class, 'destroy']);

    });

});
