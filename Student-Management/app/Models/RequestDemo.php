<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestDemo extends Model
{
    protected $fillable = [
        'full_name',
        'email',
        'phone',
        'institution_name',
        'institution_type',
        'campus_size',
        'primary_goal',
        'message'
    ];
}
