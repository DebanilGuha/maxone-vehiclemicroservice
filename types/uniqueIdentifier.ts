export interface UniqueIdentifier {
    _id:       string;
    count:     number;
    updatedAt: UpdatedAt;
}

export interface UpdatedAt {
    $date: DateClass;
}

export interface DateClass {
    $numberLong: string;
}