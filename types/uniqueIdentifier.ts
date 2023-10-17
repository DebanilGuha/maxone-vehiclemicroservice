import { Document } from 'mongodb'
export interface UniqueIdentifier extends Document {
    _id: string;
    count: number;
    updatedAt: UpdatedAt;
}
export interface TokenStorage extends Document {
    _id: string;
    token: string;
}

export interface UpdatedAt {
    $date: DateClass;
}

export interface DateClass {
    $numberLong: string;
}