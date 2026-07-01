import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import * as React from 'react';

import { cn } from '@go-tech/utils';
import { type ButtonProps, buttonVariants } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

const BasePagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
);
BasePagination.displayName = 'BasePagination';

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<'ul'>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('flex flex-row items-center gap-1', className)} {...props} />
  )
);
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<'li'>>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('', className)} {...props} />
));
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, 'size'> &
  React.ComponentProps<'a'>;

const PaginationLink = ({ className, isActive, size = 'icon', ...props }: PaginationLinkProps) => (
  <a
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? 'outline' : 'ghost',
        size
      }),
      className
    )}
    {...props}
  />
);
PaginationLink.displayName = 'PaginationLink';

const PaginationPrevious = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to previous page" size="default" className={cn('gap-1 pl-2.5', className)} {...props}>
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
);
PaginationPrevious.displayName = 'PaginationPrevious';

const PaginationNext = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to next page" size="default" className={cn('gap-1 pr-2.5', className)} {...props}>
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);
PaginationNext.displayName = 'PaginationNext';

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span aria-hidden className={cn('flex h-9 w-9 items-center justify-center', className)} {...props}>
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = 'PaginationEllipsis';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50];

type PaginationPageSizeProps = {
  className?: string;
  onPageSizeChange: (pageSize: number) => void;
  options?: number[];
  pageSize: number;
};

const PaginationPageSize = ({
  className,
  onPageSizeChange,
  options = DEFAULT_PAGE_SIZE_OPTIONS,
  pageSize
}: PaginationPageSizeProps) => {
  const pageSizeOptions = options.length > 0 ? options : DEFAULT_PAGE_SIZE_OPTIONS;
  const selectedPageSize = pageSizeOptions.includes(pageSize) ? pageSize : pageSizeOptions[0];

  return (
    <div className={cn('text-sm text-muted-foreground', className)}>
      <Select
        value={selectedPageSize.toString()}
        onValueChange={value => {
          const nextSize = Number(value);
          if (!Number.isNaN(nextSize)) {
            onPageSizeChange(nextSize);
          }
        }}
      >
        <SelectTrigger className="h-9 w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {pageSizeOptions.map(option => (
            <SelectItem key={option} value={option.toString()}>
              {`${option} 條/頁`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
PaginationPageSize.displayName = 'PaginationPageSize';

const Pagination = ({
  className,
  current = 1,
  onChange,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  total = 0
}: {
  className?: string;
  current: number;
  onChange?: (current: number, pageSize: number) => void;
  pageSize: number;
  pageSizeOptions?: number[];
  total: number;
}) => {
  const safePageSize = pageSize > 0 ? pageSize : 10;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(Math.max(current, 1), totalPages);
  const maxVisiblePages = 5;

  const pageItems: Array<number | 'ellipsis-left' | 'ellipsis-right'> = [];

  const addPageRange = (start: number, end: number) => {
    for (let i = start; i <= end; i += 1) {
      pageItems.push(i);
    }
  };

  if (totalPages <= maxVisiblePages) {
    addPageRange(1, totalPages);
  } else {
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      startPage = 2;
      endPage = 4;
    } else if (currentPage >= totalPages - 2) {
      startPage = totalPages - 3;
      endPage = totalPages - 1;
    }

    pageItems.push(1);

    if (startPage > 2) {
      pageItems.push('ellipsis-left');
    }

    addPageRange(startPage, endPage);

    if (endPage < totalPages - 1) {
      pageItems.push('ellipsis-right');
    }

    pageItems.push(totalPages);
  }

  const changePage = (nextPage: number) => {
    const targetPage = Math.min(Math.max(nextPage, 1), totalPages);
    if (targetPage !== currentPage) {
      onChange?.(targetPage, safePageSize);
    }
  };

  const changePageSize = (nextPageSize: number) => {
    onChange?.(1, nextPageSize);
  };

  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <BasePagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={isPrevDisabled}
              className={cn(isPrevDisabled && 'pointer-events-none opacity-50')}
              onClick={e => {
                e.preventDefault();
                changePage(currentPage - 1);
              }}
            />
          </PaginationItem>

          {pageItems.map((item, index) => (
            <PaginationItem key={`${item}-${index}`}>
              {typeof item === 'number' ? (
                <PaginationLink
                  href="#"
                  isActive={item === currentPage}
                  onClick={e => {
                    e.preventDefault();
                    changePage(item);
                  }}
                >
                  {item}
                </PaginationLink>
              ) : (
                <PaginationEllipsis />
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={isNextDisabled}
              className={cn(isNextDisabled && 'pointer-events-none opacity-50')}
              onClick={e => {
                e.preventDefault();
                changePage(currentPage + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </BasePagination>
      <PaginationPageSize pageSize={safePageSize} options={pageSizeOptions} onPageSizeChange={changePageSize} />
    </div>
  );
};
Pagination.displayName = 'Pagination';

export {
  BasePagination,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPageSize,
  PaginationPrevious
};
